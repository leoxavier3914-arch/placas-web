# Placas Web

Placas Web is a Next.js project used for managing vehicle registrations.

For detailed information about the framework, see the [Next.js documentation](https://nextjs.org/docs).

## Database Indexes

This project now includes indexes on the `vehicles.plate` and `authorized.plate` columns to
accelerate plate lookups. These indexes change queries from sequential scans to indexed
searches, which should noticeably reduce verification time as the number of records grows.

