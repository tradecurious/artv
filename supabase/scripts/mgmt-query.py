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
import sys
import urllib.error
import urllib.request

API_ROOT = 'https://api.supabase.com'


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
    request = urllib.request.Request(
        f'{API_ROOT}/v1/projects/{project_ref}/database/query',
        data=json.dumps({'query': sql}).encode(),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            body = response.read().decode()
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors='replace')
        try:
            detail = json.loads(detail).get('message', detail)
        except ValueError:
            pass
        # Deliberately not echoing the SQL — it may carry a secret.
        sys.exit(f'error: Supabase API returned {err.code}: {detail}')
    except urllib.error.URLError as err:
        sys.exit(f'error: could not reach {API_ROOT}: {err.reason}')

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
