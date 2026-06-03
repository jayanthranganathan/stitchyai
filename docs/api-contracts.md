# API contracts

Base URL: `https://api.thugildesigners.com/v1` (production), `http://localhost:8000/v1` (dev).

All endpoints return JSON. All non-auth endpoints require `Authorization: Bearer <jwt>`. Errors use
RFC 7807 problem details (`type`, `title`, `status`, `detail`).

The canonical, always-up-to-date source is OpenAPI at `/docs`. This file is a human summary.

## Conventions

- Resource paths are plural and kebab-case (`/order-assignments`).
- IDs are UUID v4 strings.
- Timestamps are ISO 8601 in UTC.
- Pagination: `?page=1&page_size=20`. Responses include `{ items, page, page_size, total }`.

## Auth (`/auth`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/otp/request` | Body: `{ phone }`. Sends OTP via MSG91. |
| POST | `/auth/otp/verify`  | Body: `{ phone, code }`. Returns `{ access, refresh, user, roles }`. |
| POST | `/auth/refresh`     | Body: `{ refresh }`. Returns new access token. |
| POST | `/auth/logout`      | Revokes the refresh token. |

## Users (`/users`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/users/me` | Current user with all role profiles. |
| PATCH | `/users/me` | Update name, email, addresses. |
| POST | `/users/me/addresses` | Add a delivery address. |
| DELETE | `/users/me/addresses/{id}` | Remove an address. |

## Tailors (`/tailors`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/tailors/register` | Self-register as a tailor (expertise, docs). State → `under_review`. |
| GET | `/tailors/me` | Current tailor profile. |
| PATCH | `/tailors/me` | Update profile / availability. |
| GET | `/tailors/me/orders` | Orders assigned to me. Filters: `state`, `from`, `to`. |
| GET | `/tailors/me/orders/available` | Orders matching my expertise, not yet assigned. |
| POST | `/tailors/me/interests` | Body: `{ order_id, note }`. Send interest. |
| PATCH | `/tailors/me/orders/{id}/progress` | Body: `{ progress_percent, note }`. |
| GET | `/tailors/me/reports` | Self-service reports for selected period. |

## Delivery (`/delivery`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/delivery/register` | Self-register as a delivery partner. |
| GET | `/delivery/me` | Current profile. |
| PATCH | `/delivery/me/status` | Online / offline toggle. |
| GET | `/delivery/me/assignments` | My assignments. Filter by `state`. |
| PATCH | `/delivery/me/assignments/{id}` | Update state (accepted/picked_up/delivered). |
| GET | `/delivery/me/reports` | Self-service reports. |

## Catalog (`/catalog`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/catalog/categories` | List active categories. |
| GET | `/catalog/categories/{slug}/designs` | Browse designs in a category. Filter: `tags`, `price_max`. |
| POST | `/catalog/proposals` | Submit a custom design proposal. |

## Orders (`/orders`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/orders` | Create an order (items, expected date, address). Returns Razorpay order. |
| GET | `/orders` | Current customer's orders. |
| GET | `/orders/{id}` | Order detail. |
| GET | `/orders/{id}/progress` | `{ status, progress_percent, history, eta, current_actor }`. |
| POST | `/orders/{id}/cancel` | Cancel (if state allows). |

## Payments (`/payments`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/payments/webhook` | Razorpay webhook. Verifies signature, marks payment as captured. |
| POST | `/payments/{order_id}/verify` | Client-confirm step. Body: `{ razorpay_payment_id, razorpay_signature }`. |

## Tracking (`/tracking`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/tracking/pings` | Batch insert of `{ assignment_id, lat, lng, recorded_at }[]`. |
| GET | `/tracking/orders/{id}` | Latest location + ETA for the customer's map view. |

## Admin (`/admin`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/approvals?type=tailor\|delivery\|customer\|order` | Pending approval queue. |
| POST | `/admin/tailors/{id}/approve` | Approve / reject a tailor. |
| POST | `/admin/delivery/{id}/approve` | Approve / reject a delivery partner. |
| POST | `/admin/orders/{id}/assign` | Body: `{ tailor_id }`. Assign an order. |
| GET | `/admin/orders` | All orders with filters. |
| POST | `/admin/admins` | Create another admin (super_admin only). |
| GET | `/admin/admins` | List admins. |
| PATCH | `/admin/admins/{id}` | Update permissions or suspend. |

## Reports (`/reports`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/reports/orders?from=&to=&group_by=city\|tailor\|delivery_partner\|customer&format=json\|csv` | Orders aggregate. |
| GET | `/reports/customers?from=&to=` | New customers / repeat customers by period. |
| GET | `/reports/tailors?from=&to=` | Tailor performance: orders completed, avg turnaround, rating. |
| GET | `/reports/delivery?from=&to=` | Delivery partner performance: jobs, on-time %. |

## Notifications (`/notifications`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/notifications/devices` | Register FCM token. |
| DELETE | `/notifications/devices/{id}` | Unregister. |
| GET | `/notifications` | In-app inbox. |
| PATCH | `/notifications/{id}/read` | Mark as read. |
