# Architecture & Design Patterns Learning Plan

## Overview
This plan is designed to help you master application architecture, data design patterns, and coding patterns through hands-on implementation in your NestJS backend application.

## Current Architecture Assessment

### ✅ Already Implemented
- **Repository Pattern** - Data access abstraction
- **Service Layer Pattern** - Business logic separation
- **Provider Pattern** - Pluggable email providers
- **Event Sourcing** - Domain events with outbox pattern
- **Transactional Outbox Pattern** - Reliable event publishing
- **Event-Driven Architecture** - RabbitMQ integration
- **Decorator Pattern** - NestJS decorators for metadata

### 🔄 In Progress
- Authentication system
- Role-based access control (RBAC)
- Invitation system

---

## Phase 1: Foundational Patterns (Current Focus)

### 1.1 Complete Core Infrastructure

#### Testing Infrastructure ⭐ NEXT
**Patterns to Learn:**
- **Test Pyramid Pattern** - Unit tests, integration tests, e2e tests
- **Test Data Builder Pattern** - Fluent interfaces for test data
- **Object Mother Pattern** - Predefined test objects
- **Fixture Pattern** - Reusable test setup

**Implementation Tasks:**
- Set up Jest configuration for unit tests
- Set up Supertest for e2e tests
- Create test database setup with transactions
- Build test data builders for User, Role, Permission entities
- Write repository tests with in-memory/test database
- Write service layer tests with mocked dependencies
- Create e2e tests for user CRUD operations

**Learning Goals:**
- Understand test doubles (mocks, stubs, spies)
- Learn dependency injection for testability
- Practice TDD (Test-Driven Development)

---

#### Rate Limiting
**Patterns to Learn:**
- **Throttler Pattern** - Request rate limiting
- **Token Bucket Algorithm** - Rate limiting implementation
- **Sliding Window Pattern** - Time-based rate limiting
- **Guard Pattern** - NestJS guards for cross-cutting concerns

**Implementation Tasks:**
- Implement @nestjs/throttler for API rate limiting
- Create custom rate limiter with Redis
- Build rate limiting by user ID, IP, API key
- Add rate limit headers (X-RateLimit-*)
- Create configurable rate limits per endpoint

**Learning Goals:**
- Understand distributed rate limiting
- Learn Redis for stateful operations
- Practice decorator composition

---

### 1.2 Authentication & Authorization

#### JWT Authentication
**Patterns to Learn:**
- **Strategy Pattern** - Passport.js authentication strategies
- **Guard Pattern** - Route protection
- **Middleware Pattern** - Request preprocessing
- **Claims-Based Authorization** - JWT token claims

**Implementation Tasks:**
- Implement JwtStrategy with passport
- Create AuthGuard for JWT validation
- Build refresh token mechanism (rotation pattern)
- Implement token blacklisting with Redis
- Add password hashing with bcrypt (adaptive hashing)
- Create login, logout, refresh endpoints

**Learning Goals:**
- Understand stateless authentication
- Learn token lifecycle management
- Practice security best practices (OWASP)

---

#### Permission-Based Authorization (Custom)
**Patterns to Learn:**
- **RBAC (Role-Based Access Control)** - Roles and permissions
- **ABAC (Attribute-Based Access Control)** - Context-aware permissions
- **Policy Pattern** - Authorization rules as policies
- **Specification Pattern** - Composable authorization rules

**Implementation Tasks:**
- Build PermissionsGuard with custom decorator
- Implement @RequirePermissions(...permissions) decorator
- Create permission checking service
- Build permission inheritance (role hierarchy)
- Add resource-level permissions (user can edit own profile)
- Implement permission caching layer

**Learning Goals:**
- Understand authorization vs authentication
- Learn flexible permission systems
- Practice guard composition

---

#### Keycloak Integration
**Patterns to Learn:**
- **Adapter Pattern** - Integrate external auth provider
- **Facade Pattern** - Simplify complex Keycloak API
- **Proxy Pattern** - Delegate to external service

**Implementation Tasks:**
- Set up Keycloak in Docker
- Integrate keycloak-connect with NestJS
- Map Keycloak roles to application permissions
- Implement SSO (Single Sign-On)
- Add user synchronization between Keycloak and local DB
- Create realm configuration scripts

**Learning Goals:**
- Understand OAuth2 and OIDC flows
- Learn federated identity management
- Practice integration patterns

---

## Phase 2: Advanced Data Patterns

### 2.1 Database Patterns

#### Unit of Work Pattern
**Description:** Maintains a list of objects affected by a business transaction and coordinates writing changes.

**Implementation Tasks:**
- Create UnitOfWork class to track changes
- Implement transaction boundary management
- Coordinate multiple repository operations
- Build rollback mechanisms
- Integrate with Prisma transactions

**Use Case:** Complex operations involving User + Invitation + Role in single transaction

---

#### Identity Map Pattern
**Description:** Ensures each object gets loaded only once by keeping every loaded object in a map.

**Implementation Tasks:**
- Create in-memory identity map per request
- Implement request-scoped cache with NestJS scoped providers
- Add cache invalidation logic
- Build cache consistency checks

**Use Case:** Prevent duplicate User queries in single request

---

#### Lazy Loading Pattern
**Description:** Defer loading of related data until it's accessed.

**Implementation Tasks:**
- Implement Proxy pattern for lazy-loaded relations
- Create virtual proxy for User.role
- Add eager vs lazy loading configuration
- Build query optimization strategies

**Use Case:** Load User without Role unless explicitly needed

---

#### Query Object Pattern
**Description:** Encapsulate complex queries into reusable objects.

**Implementation Tasks:**
- Create UserQuery builder class
- Implement method chaining for filters
- Add pagination, sorting, search
- Build type-safe query specifications

**Example:**
```typescript
const query = new UserQuery()
  .withRole()
  .filterByEmail('@example.com')
  .sortBy('createdAt', 'DESC')
  .paginate(page, limit);
```

---

#### Data Mapper Pattern (vs Active Record)
**Description:** Separate domain objects from database persistence logic.

**Current:** Using Data Mapper (Prisma)
**Learning:** Understand trade-offs vs Active Record (TypeORM)

**Tasks:**
- Compare Prisma (Data Mapper) with TypeORM (Active Record)
- Build rich domain models independent of Prisma
- Implement mapper classes (UserMapper: Prisma -> Domain)
- Practice domain-driven design principles

---

### 2.2 Caching Patterns

#### Cache-Aside Pattern
**Description:** Application manages cache explicitly.

**Implementation Tasks:**
- Set up Redis connection
- Create CacheService abstraction
- Implement get-or-fetch pattern
- Add cache invalidation on updates
- Build cache warming strategies

**Use Case:** Cache user permissions, roles

---

#### Write-Through Cache Pattern
**Description:** Write to cache and database simultaneously.

**Implementation Tasks:**
- Implement dual-write to cache + DB
- Handle write failures gracefully
- Add consistency checks
- Build cache synchronization

**Use Case:** Update user profile updates both DB and cache

---

#### Write-Behind (Write-Back) Cache Pattern
**Description:** Write to cache immediately, DB asynchronously.

**Implementation Tasks:**
- Buffer writes to cache
- Implement async flush to database
- Build failure recovery mechanism
- Add conflict resolution

**Use Case:** High-write scenarios (analytics, logs)

---

#### Cache Stampede Protection
**Description:** Prevent multiple cache misses from overwhelming DB.

**Implementation Tasks:**
- Implement request coalescing
- Add lock-based cache regeneration
- Build probabilistic early expiration
- Create cache key versioning

---

### 2.3 Event-Driven Patterns (Advanced)

#### Event Sourcing (Full Implementation)
**Current:** Partial with EventHistory
**Goal:** Complete event-sourced aggregates

**Implementation Tasks:**
- Build event store with full event log
- Implement aggregate rebuilding from events
- Create snapshot mechanism for performance
- Add event versioning and upcasting
- Build temporal queries (state at time T)

**Use Case:** User aggregate rebuilt from all UserEvents

---

#### CQRS (Command Query Responsibility Segregation)
**Description:** Separate read and write models.

**Implementation Tasks:**
- Create command handlers (UserCommands)
- Build query handlers (UserQueries)
- Implement separate read models
- Add eventual consistency handling
- Build projection services (Event -> ReadModel)

**Example:**
```typescript
// Write model
CreateUserCommand -> UserAggregate -> UserCreatedEvent

// Read model
UserCreatedEvent -> UserProjection -> UserReadModel (optimized for queries)
```

---

#### Saga Pattern
**Description:** Manage distributed transactions across services.

**Implementation Tasks:**
- Implement orchestration-based saga
- Create choreography-based saga
- Build compensation logic for rollbacks
- Add saga state machine
- Implement timeout handling

**Use Case:** User registration saga (CreateUser -> SendInvitation -> SendWelcomeEmail)

---

#### Event Collaboration Pattern
**Description:** Services collaborate through events without direct coupling.

**Implementation Tasks:**
- Build event-driven service communication
- Implement event subscriptions
- Add idempotent event handlers
- Create event replay mechanism

---

## Phase 3: Architectural Patterns

### 3.1 Domain-Driven Design (DDD)

#### Layered Architecture
**Layers:**
1. **Presentation Layer** - Controllers, DTOs
2. **Application Layer** - Use cases, orchestration
3. **Domain Layer** - Entities, value objects, domain services
4. **Infrastructure Layer** - Repositories, external services

**Implementation Tasks:**
- Refactor to strict layer separation
- Move business logic to domain layer
- Create application services for use cases
- Build infrastructure adapters

---

#### Aggregate Pattern
**Description:** Cluster of domain objects treated as a single unit.

**Implementation Tasks:**
- Define aggregate roots (User, Invitation)
- Enforce invariants within aggregate
- Implement aggregate boundaries
- Add consistency rules
- Build aggregate repositories

**Example:** User is aggregate root containing Email, Password value objects

---

#### Value Objects
**Description:** Immutable objects defined by their attributes.

**Implementation Tasks:**
- Create Email value object with validation
- Build Password value object with hashing
- Implement equality by value
- Add immutability guarantees

```typescript
class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    // Validation
    return new Email(email);
  }
}
```

---

#### Domain Events
**Current:** Basic implementation
**Enhancement:** Rich domain events with causation/correlation

**Implementation Tasks:**
- Add causationId (event that caused this event)
- Add correlationId (trace entire flow)
- Implement event metadata enrichment
- Build event causality chains

---

#### Domain Services
**Description:** Operations that don't belong to a single entity.

**Implementation Tasks:**
- Create PermissionCheckService (operates on User + Permission)
- Build InvitationExpirationService
- Implement UserDeactivationService (User + related entities)

---

### 3.2 Hexagonal Architecture (Ports & Adapters)

**Description:** Application core isolated from external concerns.

**Structure:**
- **Core (Hexagon):** Domain logic, ports (interfaces)
- **Adapters:** Implementations of ports (Prisma, RabbitMQ, SMTP)

**Implementation Tasks:**
- Define port interfaces (IUserRepository, IEmailService)
- Implement adapters (PrismaUserRepository, SmtpEmailAdapter)
- Invert dependencies (core depends on interfaces, not implementations)
- Add adapter swapping (e.g., switch email provider)

**Current:** EmailService already follows this with IEmailProvider

---

### 3.3 Microservices Patterns

#### API Gateway Pattern
**Implementation Tasks:**
- Build API gateway as entry point
- Route requests to internal services
- Implement request aggregation
- Add authentication at gateway

---

#### Service Discovery Pattern
**Implementation Tasks:**
- Integrate Consul or Eureka
- Implement health checks
- Build service registry
- Add client-side load balancing

---

#### Circuit Breaker Pattern
**Description:** Prevent cascading failures.

**Implementation Tasks:**
- Implement circuit breaker states (Closed, Open, Half-Open)
- Add failure threshold configuration
- Build fallback mechanisms
- Integrate with external service calls

**Use Case:** Protect against SendGrid failures

---

#### Bulkhead Pattern
**Description:** Isolate resources to prevent total failure.

**Implementation Tasks:**
- Create separate thread pools per service
- Implement resource limits
- Add queue-based isolation
- Build resource monitoring

---

## Phase 4: Advanced Coding Patterns

### 4.1 Creational Patterns

#### Factory Pattern
**Current:** EmailProvider factory
**Enhancement:** Generic factory for domain objects

**Implementation Tasks:**
- Create UserFactory with builder
- Implement EventFactory for domain events
- Build polymorphic factories
- Add abstract factory for families

---

#### Builder Pattern
**Implementation Tasks:**
- Create UserBuilder for complex construction
- Implement fluent interfaces
- Build director class for common configurations
- Add validation in build step

```typescript
const user = new UserBuilder()
  .withEmail('user@example.com')
  .withRole('admin')
  .withPermissions(['read', 'write'])
  .build();
```

---

#### Singleton Pattern
**Current:** NestJS providers (default scope)
**Learning:** Understand when/when not to use

**Implementation Tasks:**
- Review NestJS provider scopes
- Implement request-scoped providers
- Build transient providers
- Understand singleton pitfalls

---

#### Prototype Pattern
**Implementation Tasks:**
- Implement object cloning
- Create deep copy utilities
- Build copy constructors
- Add clone methods to domain objects

---

### 4.2 Structural Patterns

#### Adapter Pattern
**Current:** Email provider adapters
**Enhancement:** External API adapters

**Implementation Tasks:**
- Create third-party API adapters
- Build interface translation layers
- Implement bi-directional adapters
- Add adapter composition

---

#### Decorator Pattern
**Current:** NestJS decorators
**Enhancement:** Runtime behavior decoration

**Implementation Tasks:**
- Create logging decorator for services
- Build caching decorator
- Implement transaction decorator
- Add retry decorator
- Compose multiple decorators

```typescript
@Cached()
@Logged()
@Transactional()
async createUser(data: CreateUserDto): Promise<User> {
  // Implementation
}
```

---

#### Facade Pattern
**Implementation Tasks:**
- Create AuthFacade (simplifies Auth + User + Permission)
- Build UserManagementFacade
- Implement simplified API for complex subsystems

---

#### Proxy Pattern
**Implementation Tasks:**
- Create virtual proxy for lazy loading
- Build protection proxy for access control
- Implement remote proxy for RPC
- Add logging proxy for debugging

---

#### Composite Pattern
**Implementation Tasks:**
- Build permission tree (parent permissions contain child permissions)
- Implement role hierarchy
- Create composite validators

---

### 4.3 Behavioral Patterns

#### Strategy Pattern
**Current:** Passport strategies
**Enhancement:** Business rule strategies

**Implementation Tasks:**
- Create pricing strategy (if adding e-commerce)
- Build notification strategy (Email, SMS, Push)
- Implement validation strategies
- Add strategy selection logic

---

#### Observer Pattern
**Current:** Event emitters
**Enhancement:** Fine-grained observers

**Implementation Tasks:**
- Implement custom observer interfaces
- Build subject/observer relationships
- Add observer priority
- Create observer groups

---

#### Chain of Responsibility Pattern
**Implementation Tasks:**
- Create validation chain
- Build middleware chain
- Implement request processing pipeline
- Add handler priority and short-circuiting

**Use Case:** Request -> RateLimitHandler -> AuthHandler -> PermissionHandler -> Controller

---

#### Command Pattern
**Implementation Tasks:**
- Create command objects (CreateUserCommand)
- Implement command handler
- Build command queue
- Add undo/redo functionality
- Implement command logging

**Integration with CQRS:**
```typescript
class CreateUserCommand {
  constructor(public readonly data: CreateUserDto) {}
}

class CreateUserHandler {
  execute(command: CreateUserCommand): Promise<User> {
    // Handle command
  }
}
```

---

#### Template Method Pattern
**Implementation Tasks:**
- Create base service with template methods
- Implement hook methods for customization
- Build abstract algorithms
- Add extension points

```typescript
abstract class BaseAuthService {
  async authenticate(credentials: Credentials) {
    await this.validateCredentials(credentials);
    const user = await this.findUser(credentials);
    await this.checkPermissions(user);
    return this.createToken(user);
  }

  protected abstract findUser(credentials: Credentials): Promise<User>;
}
```

---

#### State Pattern
**Implementation Tasks:**
- Implement invitation states (Pending, Accepted, Expired)
- Build state transitions
- Add state-specific behavior
- Create state machine

```typescript
class Invitation {
  private state: InvitationState;

  accept() {
    this.state.accept(this);
  }
}
```

---

#### Specification Pattern
**Implementation Tasks:**
- Create query specifications
- Implement composable specifications (AND, OR, NOT)
- Build specification evaluators
- Add specification to repository integration

```typescript
const spec = new UserEmailSpec('@example.com')
  .and(new UserActiveSpec())
  .and(new UserRoleSpec('admin'));

const users = await userRepo.find(spec);
```

---

## Phase 5: System Design Patterns

### 5.1 Scalability Patterns

#### Database Sharding
**Implementation Tasks:**
- Research sharding strategies (range, hash, directory)
- Implement shard key selection
- Build routing logic
- Add cross-shard queries

---

#### Read Replicas
**Implementation Tasks:**
- Configure PostgreSQL replication
- Route reads to replicas
- Handle replication lag
- Implement eventual consistency

---

#### Message Queue Patterns
**Current:** RabbitMQ for events
**Enhancement:** Advanced queue patterns

**Patterns:**
- **Competing Consumers** - Multiple workers, one queue
- **Priority Queue** - High-priority messages first
- **Dead Letter Queue** - Failed message handling
- **Message Routing** - Topic-based routing

---

### 5.2 Reliability Patterns

#### Retry Pattern
**Implementation Tasks:**
- Implement exponential backoff
- Add jitter to prevent thundering herd
- Build retry budgets
- Create idempotent operations

---

#### Timeout Pattern
**Implementation Tasks:**
- Add operation timeouts
- Implement deadline propagation
- Build timeout handling
- Create timeout monitoring

---

#### Health Check Pattern
**Implementation Tasks:**
- Create /health endpoint
- Implement liveness probes
- Add readiness probes
- Build dependency health checks

---

### 5.3 Observability Patterns

#### Structured Logging
**Implementation Tasks:**
- Integrate Winston or Pino
- Implement correlation IDs
- Add contextual logging
- Build log aggregation (ELK stack)

**Enhancement to existing:**
```typescript
logger.info('User created', {
  correlationId: ctx.correlationId,
  userId: user.id,
  actorId: ctx.actorId,
  event: 'user.created'
});
```

---

#### Distributed Tracing
**Implementation Tasks:**
- Integrate OpenTelemetry
- Add trace context propagation
- Implement span creation
- Build trace visualization (Jaeger)

---

#### Metrics Collection
**Implementation Tasks:**
- Integrate Prometheus
- Create custom metrics
- Add metric exporters
- Build Grafana dashboards

---

## Learning Resources

### Books
1. **"Patterns of Enterprise Application Architecture"** - Martin Fowler
2. **"Domain-Driven Design"** - Eric Evans
3. **"Implementing Domain-Driven Design"** - Vaughn Vernon
4. **"Design Patterns: Elements of Reusable Object-Oriented Software"** - Gang of Four
5. **"Building Microservices"** - Sam Newman
6. **"Clean Architecture"** - Robert C. Martin
7. **"Advanced React"** - (for frontend learning)

### Documentation
1. **NestJS Fundamentals** - Complete official docs
2. **Prisma Best Practices**
3. **RabbitMQ Patterns**
4. **React Official Docs**

### Practice Approach
1. **Read theory** for pattern (1-2 hours)
2. **Plan on paper** without AI (30 mins)
3. **Implement** with AI assistance
4. **Refactor** without AI
5. **Document learnings** in markdown

---

## Suggested Implementation Order

### Sprint 1-2: Foundation
1. ✅ Event system (completed)
2. ⭐ Test infrastructure setup
3. Rate limiting
4. Logging infrastructure

### Sprint 3-4: Authentication & Authorization
5. JWT authentication with custom permission system
6. Role-based access control implementation
7. Keycloak integration (on separate branch)

### Sprint 5-6: Advanced Data Patterns
8. Caching layer (Redis)
9. CQRS implementation for users
10. Complete event sourcing with snapshots

### Sprint 7-8: Architectural Patterns
11. Full DDD refactoring
12. Hexagonal architecture implementation
13. Advanced query patterns

### Sprint 9-10: Reliability & Observability
14. Circuit breaker for external services
15. Distributed tracing
16. Metrics and monitoring

### Sprint 11-12: Performance & Scale
17. Optimize for 10k writes/sec (separate branch)
18. Database sharding research
19. Load testing and profiling

---

## Success Metrics

### Understanding
- [ ] Can explain each pattern without looking at code
- [ ] Can identify when to use each pattern
- [ ] Can articulate trade-offs

### Implementation
- [ ] Tests pass for all features
- [ ] Code reviews show pattern understanding
- [ ] Can refactor code to use patterns

### Application
- [ ] Can design new features using appropriate patterns
- [ ] Can critique existing code architecture
- [ ] Can propose improvements

---

## Additional Suggestions for Your List

### Backend Patterns to Add:
- **Specification Pattern** - Composable business rules ⭐ High priority for permissions
- **Null Object Pattern** - Avoid null checks
- **Data Transfer Object (DTO) Pattern** - Already using, formalize with class-validator
- **Service Locator Pattern** (anti-pattern to avoid - know why it's bad)
- **Dependency Injection Container** - NestJS provides this, deepen understanding
- **Middleware Pipeline Pattern** - Request processing (logging, auth, etc.)
- **Interceptor Pattern** - Cross-cutting concerns (transform responses, logging)
- **Exception Filter Pattern** - Global error handling
- **Pipe Pattern** - Data transformation and validation
- **Module Pattern** - Code organization (NestJS modules)
- **Result Pattern** - Alternative to exceptions for flow control
- **Option/Maybe Pattern** - Type-safe null handling

### Infrastructure to Add:
- **API Versioning** - v1, v2 support (URI vs header vs media type)
- **Request ID Tracking / Correlation ID** - Trace requests across services ⭐
- **Database Migrations Strategy** - Prisma migrations best practices
- **Environment Configuration** - Config validation with class-validator
- **Secrets Management** - Vault, AWS Secrets Manager, or environment-based
- **API Documentation** - Swagger/OpenAPI (you mentioned this) ⭐
- **GraphQL Layer** - Alternative to REST (optional advanced topic)
- **WebSocket Support** - Real-time features (Socket.io, native WebSockets)
- **File Upload/Storage** - S3 pattern, multipart uploads, presigned URLs
- **Scheduled Jobs** - Cron jobs with @nestjs/schedule, bull queues
- **Feature Flags** - Toggle features without deployment
- **Database Connection Pooling** - Optimize Prisma connections
- **Request Throttling per User** - Beyond basic rate limiting
- **Idempotency Keys** - Prevent duplicate operations
- **Soft Deletes** - Keep audit trail instead of hard deletes
- **Multi-tenancy Patterns** - If building SaaS (separate DB, shared DB, schema-based)

### Advanced Backend Topics:
- **Message Deduplication** - Ensure exactly-once event processing
- **Event Schema Versioning** - Handle event evolution
- **Blue-Green Deployment** - Zero-downtime deployments
- **Database Backup & Restore Strategy**
- **Data Migration Patterns** - Large dataset migrations
- **Background Job Processing** - Bull, BullMQ for async work
- **Search Engine Integration** - Elasticsearch, Algolia
- **Real-time Analytics** - Time-series data with TimescaleDB
- **Audit Logging** - Who changed what when (you have some with events)
- **Data Anonymization** - GDPR compliance patterns

### Security Patterns to Learn:
- **Input Validation & Sanitization** - Prevent XSS, SQL injection
- **Rate Limiting Strategies** - Per IP, per user, per endpoint
- **CORS Configuration** - Proper cross-origin setup
- **CSP (Content Security Policy)** - Additional XSS protection
- **Helmet.js** - Security headers
- **SQL Injection Prevention** - Parameterized queries (Prisma handles this)
- **Password Hashing** - bcrypt, argon2 (adaptive algorithms)
- **API Key Management** - Generate, rotate, revoke
- **OAuth2 Scopes** - Fine-grained permissions
- **Session Management** - Session fixation, hijacking prevention
- **Encryption at Rest** - Database encryption
- **Encryption in Transit** - TLS/SSL
- **Secrets Rotation** - Automatic credential rotation

### Frontend Patterns (for React):
- **Container/Presenter Pattern** - Separate logic from UI
- **Compound Components Pattern** - Flexible component APIs
- **Render Props Pattern** - Share behavior between components
- **Higher-Order Components (HOC)** - Component enhancement
- **Custom Hooks Pattern** - Reusable stateful logic ⭐
- **Controlled/Uncontrolled Components** - Form inputs
- **State Management Patterns** - Context, Redux, Zustand, Jotai
- **Form Validation Patterns** - React Hook Form, Formik
- **Error Boundary Pattern** - Graceful error handling
- **Code Splitting Pattern** - Lazy loading with React.lazy
- **Optimistic UI Updates** - Update UI before server responds
- **Infinite Scrolling / Virtual Lists** - Performance for large lists
- **Debouncing & Throttling** - Search inputs, resize handlers
- **Memoization** - useMemo, useCallback, React.memo
- **Portal Pattern** - Modals, tooltips rendered outside hierarchy
- **Provider Pattern** - Context for dependency injection
- **Composition over Inheritance** - Component design philosophy

### Testing Patterns (Already in testing-implementation-guide.md):
- ✅ Test Pyramid Pattern
- ✅ Test Data Builder Pattern
- ✅ Object Mother Pattern
- ✅ Fixture Pattern
- **Mutation Testing** - Test your tests (Stryker)
- **Contract Testing** - API contracts (Pact)
- **Visual Regression Testing** - Screenshot comparison
- **Performance Testing** - Load testing (k6, Artillery)
- **Chaos Engineering** - Failure injection testing

### DevOps & Deployment Patterns:
- **CI/CD Pipeline** - GitHub Actions, GitLab CI
- **Docker Multi-stage Builds** - Optimize image size
- **Docker Compose for Development** - You already have this ✅
- **Kubernetes Deployment** - Container orchestration (advanced)
- **Health Checks & Readiness Probes** - For load balancers
- **Graceful Shutdown** - Handle SIGTERM properly
- **Environment Parity** - Dev/staging/prod consistency
- **Infrastructure as Code** - Terraform, Pulumi
- **Log Aggregation** - ELK stack, Datadog, CloudWatch
- **APM (Application Performance Monitoring)** - New Relic, Datadog
- **Error Tracking** - Sentry, Rollbar
- **Database Seeding** - You already have seed scripts ✅

---

## Your Updated Implementation Plan

Based on your existing list and the comprehensive pattern learning plan above, here's an enhanced version of your plan with pattern learning integrated:

### Completed ✅
- Event service (transactional outbox + RabbitMQ)
- Email service with provider pattern
- Docker infrastructure (PostgreSQL, RabbitMQ, MailHog)

### Phase 1: Testing & Quality Foundation (Next Priority)
1. **Build test setup** ⭐ NEXT
   - Follow [testing-implementation-guide.md](testing-implementation-guide.md)
   - **Patterns to learn**: Test Pyramid, Fixtures, Mocks, AAA pattern
   - **Goal**: 80% code coverage minimum

2. **Build logging infrastructure**
   - Implement structured logging with Winston/Pino
   - Add correlation IDs for request tracing
   - **Patterns to learn**: Structured Logging, Correlation ID pattern
   - **Integration**: Log all events, service calls, errors

3. **Build rate limiting**
   - NestJS throttler for basic rate limiting
   - Redis-based rate limiting for advanced scenarios
   - **Patterns to learn**: Token Bucket, Sliding Window, Guard pattern

### Phase 2: Authentication & Authorization
4. **Build auth guard to check JWT token**
   - Passport JWT strategy
   - Token refresh mechanism
   - **Patterns to learn**: Strategy Pattern, Guard Pattern, Claims-based Auth

5. **Build out auth service with invite sign up, login**
   - Invitation flow with secure token generation
   - Password hashing with bcrypt/argon2
   - **Patterns to learn**: Factory Pattern (token creation), Adaptive Hashing

6. **Build out users, roles, permissions**
   - Complete user CRUD (expand existing)
   - Role hierarchy
   - Permission system foundation
   - **Patterns to learn**: RBAC, Aggregate pattern (User as aggregate root)

7. **Build auth guard for permission checks**
   - @RequirePermissions() decorator
   - Resource-level permissions
   - **Patterns to learn**: Specification Pattern, Policy Pattern, Decorator Pattern

8. **Build out invitation service**
   - Complete the skeleton invitation service
   - Invitation expiration handling
   - Email integration
   - **Patterns to learn**: State Pattern (invitation states), Domain Service

9. **Build auth system with Keycloak (separate branch)**
   - Keycloak integration
   - SSO implementation
   - User synchronization
   - **Patterns to learn**: Adapter Pattern, Facade Pattern, Federation

### Phase 3: Advanced Infrastructure
10. **Build database service enhancements**
    - Query builder pattern
    - Connection pooling optimization
    - **Patterns to learn**: Query Object, Unit of Work, Identity Map

11. **Build cache layer**
    - Redis integration
    - Cache-aside pattern
    - Cache invalidation strategies
    - **Patterns to learn**: Cache-Aside, Write-Through, Cache Stampede Protection

12. **Build transactional outbox events enhancements**
    - Cleanup repetitions in events (your note)
    - Event versioning
    - Event schema evolution
    - **Patterns to learn**: Event Versioning, Message Deduplication

13. **Build out Swagger docs**
    - OpenAPI documentation
    - Auto-generate from decorators
    - **Patterns to learn**: Documentation patterns, API versioning

### Phase 4: Advanced Patterns & Refactoring
14. **Refactor to CQRS**
    - Separate command and query models
    - Command handlers for writes
    - Query handlers for reads
    - **Patterns to learn**: CQRS, Command Pattern

15. **Implement Domain-Driven Design**
    - Refactor to layered architecture
    - Create value objects (Email, Password)
    - Define aggregate boundaries
    - **Patterns to learn**: DDD Aggregates, Value Objects, Domain Services

16. **Implement advanced event patterns**
    - Event Sourcing with snapshots
    - Saga pattern for workflows
    - **Patterns to learn**: Event Sourcing, Saga (Orchestration vs Choreography)

### Phase 5: Scalability & Reliability
17. **Build circuit breaker for external services**
    - Protect against cascading failures
    - Fallback mechanisms
    - **Patterns to learn**: Circuit Breaker, Bulkhead, Retry with backoff

18. **Implement observability**
    - Distributed tracing (OpenTelemetry)
    - Metrics collection (Prometheus)
    - APM integration
    - **Patterns to learn**: Observability patterns, Distributed Tracing

19. **Build scheduled jobs system**
    - Cron jobs with @nestjs/schedule
    - Background job processing with Bull
    - **Patterns to learn**: Job Queue, Worker Pool

### Phase 6: Performance Optimization (Separate Branch)
20. **Optimize for 10,000 writes/sec**
    - Database query optimization
    - Connection pooling tuning
    - Event publishing optimization
    - Horizontal scaling strategies
    - **Patterns to learn**: Sharding, Read Replicas, Message Batching, Load Balancing

### Cleanup & Best Practices (Ongoing)
- Use enums and constants (reduce magic strings)
- Eliminate code repetition in events
- Apply SOLID principles consistently
- Code review against design patterns
- Document architectural decisions (ADRs)

---

## Learning Methodology

### The "Plan on Paper" Approach
As you mentioned, you want to:
> "Prodji kroz nesto sta oces da napravis sa claude kodom i ispisi na papir korake, ne pune detalje i pokusaj to da napravis, bez upotrebe ai alata"

**Recommended workflow for each feature:**

1. **Research Phase (1-2 hours)**
   - Read pattern documentation
   - Review examples from books/articles
   - Understand the "why" behind the pattern

2. **Planning Phase (30-60 mins) - ON PAPER 📝**
   - Write down the problem you're solving
   - List the steps needed (high-level)
   - Sketch class diagrams or data flow
   - Identify which patterns to apply
   - **Do NOT write actual code yet**
   - **Do NOT use AI tools during this phase**

3. **Implementation Phase - First Attempt (Solo)**
   - Try implementing based on your paper plan
   - Use only official documentation (NestJS, Prisma, etc.)
   - Struggle through it - this is where deep learning happens!
   - Note where you get stuck

4. **AI-Assisted Refinement**
   - Now use Claude Code or other AI tools
   - Show your implementation and ask for review
   - Learn from suggested improvements
   - Understand WHY the improvements are better

5. **Testing Phase**
   - Write tests (following your test guide)
   - Ensure patterns are working correctly
   - Refactor based on test feedback

6. **Documentation Phase**
   - Document what you learned
   - Create example code snippets
   - Add to your patterns reference library
   - Update this plan with ✅ checkmarks

### Example: Building Rate Limiting

**Paper Plan (30 mins):**
```
Problem: Prevent API abuse, ensure fair usage

Steps:
1. Choose rate limiting strategy (token bucket? sliding window?)
2. Decide storage (in-memory for simple, Redis for distributed)
3. Create guard that checks rate limits before controller
4. Add decorator @Throttle() to routes
5. Return 429 Too Many Requests when exceeded
6. Test with curl/Postman

Patterns:
- Guard Pattern (NestJS guard)
- Decorator Pattern (@Throttle)
- Token Bucket Algorithm
```

**Implementation (Solo):**
- Try building it yourself using NestJS docs
- Get stuck? That's OK! Note where and why.

**AI Refinement:**
- Ask Claude: "Review my rate limiting implementation, suggest improvements"
- Learn about Redis optimization, distributed scenarios, etc.

### Knowledge Capture

Create a `docs/patterns/` directory:
```
docs/patterns/
├── repository-pattern.md
├── factory-pattern.md
├── event-sourcing.md
├── cqrs.md
└── ...
```

Each file should have:
1. **What it is** - Brief description
2. **When to use it** - Scenarios
3. **When NOT to use it** - Anti-patterns
4. **Implementation in this codebase** - File references
5. **Lessons learned** - Your notes

---

## Quick Reference: Features → Patterns Learned

| Your Feature | Primary Patterns | Secondary Patterns | Difficulty |
|--------------|------------------|-------------------|------------|
| Test setup | Test Pyramid, AAA, Fixtures | Object Mother, Test Data Builder | ⭐⭐ Medium |
| Rate limiting | Token Bucket, Sliding Window | Guard, Throttler | ⭐ Easy |
| Email service | Provider, Strategy | Factory, Adapter | ⭐ Easy (✅ Done) |
| Event system | Transactional Outbox, Event Sourcing | Observer, Publisher-Subscriber | ⭐⭐⭐⭐ Hard (✅ Done) |
| Logging | Structured Logging, Correlation ID | Interceptor, Middleware | ⭐⭐ Medium |
| JWT Auth | Strategy (Passport), Guard | Claims-based Auth | ⭐⭐ Medium |
| Permission system | RBAC, Specification | Policy, Decorator | ⭐⭐⭐ Hard |
| Invitations | State Machine, Domain Service | Factory, Value Object | ⭐⭐ Medium |
| Database layer | Repository, Unit of Work | Query Object, Identity Map | ⭐⭐⭐ Hard |
| Cache layer | Cache-Aside, Write-Through | Cache Stampede Protection | ⭐⭐ Medium |
| CQRS | CQRS, Command Pattern | Event Sourcing, Projection | ⭐⭐⭐⭐ Hard |
| DDD Refactor | Aggregate, Value Object | Domain Service, Layered Architecture | ⭐⭐⭐⭐⭐ Very Hard |
| Circuit Breaker | Circuit Breaker, Bulkhead | Retry, Fallback | ⭐⭐⭐ Hard |
| Observability | Distributed Tracing | Metrics, APM | ⭐⭐⭐ Hard |
| Keycloak | Adapter, Facade | Federation, Proxy | ⭐⭐⭐ Hard |
| Saga | Saga (Orchestration/Choreography) | Compensation, State Machine | ⭐⭐⭐⭐⭐ Very Hard |

---

## Recommended Learning Path by Difficulty

### Beginner-Friendly Patterns (Start Here)
1. **Repository Pattern** - Already using, formalize understanding
2. **Factory Pattern** - Create objects (tokens, events)
3. **Guard Pattern** - NestJS guards for auth
4. **Decorator Pattern** - NestJS decorators
5. **Strategy Pattern** - Email providers, Passport strategies

### Intermediate Patterns (After Comfort with Basics)
6. **Specification Pattern** - Permission rules
7. **State Pattern** - Invitation states
8. **Template Method** - Reusable algorithms
9. **Chain of Responsibility** - Middleware pipeline
10. **Observer Pattern** - Event handling

### Advanced Patterns (After Solid Foundation)
11. **Unit of Work** - Transaction management
12. **CQRS** - Read/write separation
13. **Event Sourcing** - Full event log
14. **Domain-Driven Design** - Aggregates, value objects
15. **Circuit Breaker** - Resilience patterns

### Expert Patterns (After Mastery of Above)
16. **Saga Pattern** - Distributed transactions
17. **Event Collaboration** - Service choreography
18. **Hexagonal Architecture** - Ports & Adapters
19. **Microservices Patterns** - Service mesh, discovery

---

## Weekly Study Template

### Week 1 Example: Testing Setup
**Monday-Tuesday: Research**
- Read Jest documentation
- Read "Testing Best Practices" articles
- Review testing-implementation-guide.md

**Wednesday: Plan on Paper**
- Sketch test infrastructure
- List test scenarios for UserService
- No coding, no AI

**Thursday-Friday: Implement Solo**
- Set up Jest configs
- Write first unit tests
- Struggle with mocking - that's OK!

**Weekend: Refine with AI**
- Ask Claude for test review
- Learn about edge cases
- Improve test coverage

**Sunday: Document**
- Add notes to docs/patterns/testing-patterns.md
- Update this plan with ✅
- Reflect: What did I learn?

---

## Notes
- This is a living document - update as you learn
- Track completed patterns in your main plan with ✅
- Document learnings in `docs/patterns/` directory
- Create example code for each pattern in `examples/` directory
- Build a patterns reference library for quick lookup
- Schedule weekly reviews: What did I learn? What patterns did I apply?
- Pair this with the NestJS fundamentals documentation study
- Review "Clean Code" principles as you implement each pattern
- Don't rush - deep understanding takes time
- It's OK to struggle - that's where learning happens
- Celebrate small wins - each pattern mastered is progress

---

## Resources Quick Links

### Books (Priority Order)
1. **"Clean Code"** - Robert C. Martin (reading now)
2. **"Patterns of Enterprise Application Architecture"** - Martin Fowler (for backend patterns)
3. **"Domain-Driven Design"** - Eric Evans (before DDD refactor)
4. **"Advanced React"** - (for frontend when ready)
5. **"Design Patterns"** - Gang of Four (reference book)

### Official Docs (Must Read)
1. [NestJS Fundamentals](https://docs.nestjs.com/fundamentals) - All sections
2. [Prisma Best Practices](https://www.prisma.io/docs/guides)
3. [React Docs](https://react.dev) - New docs are excellent
4. [RabbitMQ Patterns](https://www.rabbitmq.com/getstarted.html)

### Online Courses (Optional)
- NestJS Advanced Patterns course
- Domain-Driven Design Distilled
- Testing JavaScript (Kent C. Dodds)

---

## Your Learning Goals

### By End of Month 1
- ✅ Complete test infrastructure
- ✅ Understand Repository, Factory, Strategy patterns deeply
- ✅ Build JWT authentication
- ✅ Implement basic rate limiting
- **Metric**: 80% test coverage on existing code

### By End of Month 2
- ✅ Complete permission system with Specification pattern
- ✅ Finish invitation system with State pattern
- ✅ Add caching layer
- ✅ Implement structured logging
- **Metric**: Can explain 10+ patterns without looking at docs

### By End of Month 3
- ✅ CQRS implementation
- ✅ Start DDD refactoring
- ✅ Add circuit breaker
- ✅ Implement observability
- **Metric**: Can design new features using appropriate patterns

### By End of Month 6
- ✅ Complete DDD transformation
- ✅ Saga pattern for complex workflows
- ✅ Keycloak integration (alternative branch)
- ✅ Optimize for 10k writes/sec
- ✅ Build comprehensive React frontend with shadcn
- **Metric**: Can architect a production-grade application from scratch

---

Good luck with your learning journey! Remember: **Understanding > Implementation Speed**
