# Security Specification - Auto Fácil

## 1. Data Invariants
- A car must have a seller.
- A client can only reserve/favorite/review if they are active.
- Only admins can change user roles or ban users.
- Sellers can only modify/delete their own cars.
- Reservations must have an expiration date in the future upon creation.
- A user cannot set their own role during registration.

## 2. The Dirty Dozen Payloads (Failures)
1. **Self-Elevated Role**: User "client_1" tries to update `users/client_1` role to "admin".
2. **Anonymous Reservation**: Unauthenticated user tries to reserve a car.
3. **Price Manipulation**: Client tries to update a car's price.
4. **Shadow User Field**: Creating user profile with `isVerified: true` hidden field.
5. **Unauthorized Car Delete**: Seller_A tries to delete Seller_B's car.
6. **Orphaned Reservation**: Creating reservation for a non-existent car ID.
7. **Banned User Action**: User with status "banned" tries to post a car.
8. **Invalid Rating**: Review with `rating: 10`.
9. **Fake Timestamp**: Client sends `createdAt: "2020-01-01"` instead of server time.
10. **Huge ID**: Trying to create a car with a 1MB string as ID.
11. **Client Role Change**: User profile creation where user sets `role: "admin"`.
12. **Double Status**: Updating car status to "sold" when it's already "sold" (state logic).

## 3. Test Runner (Draft)
I will implement `firestore.rules` and verify these logic gates.
