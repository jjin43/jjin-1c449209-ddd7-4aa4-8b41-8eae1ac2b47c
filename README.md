# Justin Jin

Setup Instructions
    ● How to run backend and frontend applications
    ● .env configuration (JWT secrets, database config)

Architecture Overview
    ● NX monorepo layout and rationale
    ● Explanation of shared libraries and modules

Data Model Explanation
    ● Schema description
    ● ERD or diagram
    - 2-level hierarchy enforced at service layer (Organizations no grandchildren).

Access Control Implementation
    ● Role, permission, and organization hierarchy
    ● How JWT authentication integrates with access control

API Documentation
    ● Endpoint list
    ● Sample requests and responses

Future Considerations
    ● Advanced role delegation
    ● Production-ready security:
        ○ JWT refresh tokens
        ○ CSRF protection
        ○ RBAC caching
    ● Efficient scaling of permission checks