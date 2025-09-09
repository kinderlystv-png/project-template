# GitHub Issues для технического долга

## Template для создания issues:

### Issue 1: [HIGH] Implement HTML report generation in CLI

```
**Priority**: High 🔴
**Type**: enhancement
**Component**: CLI
**Labels**: `technical-debt`, `enhancement`, `high-priority`, `cli`

**Description**:
Missing HTML report generation functionality in CLI module.

**File**: `eap-analyzer/src/cli.ts:52`
**Current state**: `// TODO: Реализовать создание HTML отчета`

**Acceptance Criteria**:
- [ ] Create HTML report generator module
- [ ] Integrate with CLI interface
- [ ] Add templates for different report types
- [ ] Include CSS styling for reports
- [ ] Add tests for HTML generation

**Estimated effort**: 5-8 hours
**Impact**: Critical functionality missing
```

### Issue 2: [HIGH] Replace mock data with real analytics in bug-fix validator

```
**Priority**: High 🔴
**Type**: bug
**Component**: Validation
**Labels**: `technical-debt`, `bug`, `high-priority`, `validation`

**Description**:
Bug fix validator uses hardcoded zero values instead of real analysis data.

**File**: `eap-analyzer/src/validation/bug-fix-validator.ts:354`
**Current state**: `analyzedGenerated: 0, // TODO: получить из реальных данных`

**Acceptance Criteria**:
- [ ] Identify source of real analyzed data
- [ ] Integrate data collection from analysis modules
- [ ] Replace hardcoded values with dynamic calculations
- [ ] Add validation for data accuracy
- [ ] Update tests with real data scenarios

**Estimated effort**: 3-5 hours
**Impact**: Inaccurate analysis metrics
```

### Issue 3: [MEDIUM] Add processed entries counter to logger

```
**Priority**: Medium 🟡
**Type**: enhancement
**Component**: Logger
**Labels**: `technical-debt`, `enhancement`, `medium-priority`, `logger`

**Description**:
Logger statistics missing processed entries counter for performance monitoring.

**File**: `src/lib/logger/core/index.ts:348`
**Current state**: `totalProcessed: 0, // TODO: добавить счетчик обработанных записей`

**Acceptance Criteria**:
- [ ] Add counter increment logic
- [ ] Include counter in statistics export
- [ ] Add performance metrics tracking
- [ ] Update documentation
- [ ] Add tests for counter functionality

**Estimated effort**: 2-3 hours
**Impact**: Missing performance monitoring
```

### Issue 4: [MEDIUM] Extract magic numbers to configuration in route checker

```
**Priority**: Medium 🟡
**Type**: refactor
**Component**: Route Checker
**Labels**: `technical-debt`, `refactor`, `medium-priority`, `configuration`

**Description**:
Route checker algorithm uses hardcoded scoring values that should be configurable.

**File**: `eap-analyzer/src/modules/emt/checkers/routes.checker.ts:67`
**Current state**: `Math.max(0, 100 - issues.length * 20 - warnings.length * 5)`

**Acceptance Criteria**:
- [ ] Create configuration object for scoring
- [ ] Extract magic numbers (20, 5) to config
- [ ] Add default values
- [ ] Allow configuration override
- [ ] Update tests with different configurations

**Estimated effort**: 1-2 hours
**Impact**: Improved algorithm configurability
```

### Issue 5: [LOW] Documentation comment in duplication detector

```
**Priority**: Low 🟢
**Type**: documentation
**Component**: Structure Analyzer
**Labels**: `technical-debt`, `documentation`, `low-priority`

**Description**:
Comment can be improved or left as-is during future refactoring.

**File**: `eap-analyzer/src/modules/structure-analyzer/duplication-detector.ts:55`
**Current state**: `/^\s*console\.(log|error|warn)/, // Логирование`

**Acceptance Criteria**:
- [ ] Review comment necessity
- [ ] Improve if needed during refactoring
- [ ] No immediate action required

**Estimated effort**: 0 hours
**Impact**: Minimal
```

## Issue Creation Instructions:

1. **Create issues in order of priority** (High → Medium → Low)
2. **Use provided labels** for filtering and tracking
3. **Assign to appropriate team members** based on component expertise
4. **Link issues to milestone** "Technical Debt Cleanup - Phase 3"
5. **Add to project board** for tracking progress

## Labels to create in repository:

- `technical-debt` (color: #d73a4a)
- `high-priority` (color: #b60205)
- `medium-priority` (color: #fbca04)
- `low-priority` (color: #0e8a16)
- Component-specific labels as needed

## Milestone:

Create milestone "Technical Debt Cleanup - Phase 3" with target date 4-5 weeks from now.
