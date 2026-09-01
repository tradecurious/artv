#!/usr/bin/env python3
"""Run SQL against a Supabase project through the Management API.

Only a personal access token (sbp_...) is needed — no database password, which
matters because a project's password cannot be read back after creation and
rotating it breaks anything already using it.

Understands the same :'name' placeholders psql uses, so supabase/vault-secrets.sql
runs unchanged through either this or psql.

    export SUPABASE_ACCESS_TOKEN=sbp_...
    mgmt-query.py --project-ref <ref> --file supabase/vault-secrets.sql \
        --var fn_url=https://... --var fn_secret=<secret>

Never prints the SQL it sends: a substituted value may be a credential.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

API_ROOT = 'https://api.supabase.com'

# api.supabase.com sits behind Cloudflare, whose browser-integrity check rejects
# urllib's default User-Agent outright ("403: error code: 1010"). curl is the
# client Supabase's own API reference demonstrates, so it is the one that gets
# through. Both the token and the request body are passed via files rather than
# argv, so neither shows up in the process list.
USER_AGENT = 'vthepeople-welcome-email-deploy/1.0'


def sql_literal(value: str) -> str:
    """Quote a value as a Postgres string literal."""
    return "'" + value.replace("'", "''") + "'"


def substitute(sql: str, variables: dict) -> str:
    """Replace psql-style :'name' placeholders with quoted literals."""
    def replace(match):
        name = match.group(1)
        if name not in variables:
            sys.exit(f"error: SQL references :'{name}' but no --var {name}= was given")
        return sql_literal(variables[name])

    return re.sub(r":'([A-Za-z_][A-Za-z0-9_]*)'", replace, sql)


def run_query(project_ref: str, token: str, sql: str) -> object:
    url = f'{API_ROOT}/v1/projects/{project_ref}/database/query'

    with tempfile.TemporaryDirectory() as workdir:
        body_path = os.path.join(workdir, 'body.json')
        config_path = os.path.join(workdir, 'curl.cfg')

        with open(body_path, 'w', encoding='utf-8') as handle:
            json.dump({'query': sql}, handle)

        with open(config_path, 'w', encoding='utf-8') as handle:
            handle.write(
                f'header = "Authorization: Bearer {token}"\n'
                'header = "Content-Type: application/json"\n'
                f'user-agent = "{USER_AGENT}"\n'
                f'data-binary = "@{body_path}"\n'
            )

        response_path = os.path.join(workdir, 'response')
        completed = subprocess.run(
            ['curl', '--silent', '--show-error', '--request', 'POST',
             '--config', config_path,
             '--output', response_path,
             '--write-out', '%{http_code}',
             '--max-time', '120', url],
            capture_output=True, text=True,
        )

        if completed.returncode != 0:
            sys.exit(f'error: curl failed: {completed.stderr.strip() or completed.returncode}')

        status = completed.stdout.strip()
        try:
            with open(response_path, encoding='utf-8', errors='replace') as handle:
                body = handle.read()
        except OSError:
            body = ''

    if not status.startswith('2'):
        detail = body.strip()
        try:
            detail = json.loads(detail).get('message', detail)
        except ValueError:
            pass
        # Deliberately not echoing the SQL — it may carry a secret.
        sys.exit(f'error: Supabase API returned {status}: {detail[:500]}')

    try:
        return json.loads(body) if body.strip() else []
    except ValueError:
        return body


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project-ref', required=True)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--file', help="SQL file to run ('-' for stdin)")
    source.add_argument('--sql', help='SQL string to run')
    parser.add_argument('--var', action='append', default=[], metavar='NAME=VALUE',
                        help="value for a :'NAME' placeholder; repeatable")
    parser.add_argument('--expect-rows', type=int, metavar='N',
                        help='fail unless the query returns at least N rows; use to '
                             'assert a check query actually found something')
    args = parser.parse_args()

    token = os.environ.get('SUPABASE_ACCESS_TOKEN', '').strip()
    if not token:
        sys.exit('error: SUPABASE_ACCESS_TOKEN is not set')

    variables = {}
    for item in args.var:
        if '=' not in item:
            sys.exit(f'error: --var expects NAME=VALUE, got {item!r}')
        name, value = item.split('=', 1)
        variables[name] = value

    if args.sql is not None:
        sql = args.sql
        label = '<inline sql>'
    elif args.file == '-':
        sql = sys.stdin.read()
        label = '<stdin>'
    else:
        with open(args.file, encoding='utf-8') as handle:
            sql = handle.read()
        label = args.file

    if not sql.strip():
        sys.exit(f'error: {label} contained no SQL')

    result = run_query(args.project_ref, token, substitute(sql, variables))

    rows = len(result) if isinstance(result, list) else 1

    # Without this, a check query that finds nothing still exits 0 — so a
    # missing trigger would be reported as a successful deploy.
    if args.expect_rows is not None and rows < args.expect_rows:
        sys.exit(f'error: {label} returned {rows} row(s), expected at least '
                 f'{args.expect_rows}')

    print(f'{label}: applied ({rows} row(s) returned)')


if __name__ == '__main__':
    main()
