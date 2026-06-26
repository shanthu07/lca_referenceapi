export const GET_COUNTRIES = `
  SELECT CountryId, CountryName
  FROM lca_common.Country
  WHERE IsActive = @isActive
  ORDER BY CountryName
`;

export const GET_PROCESS_CATEGORY_MASTER = `
  SELECT 
    ProcessCategoryID,
    IndustryId,
    CategoryName,
    Description,
    ParentCategoryID,
    IsActive,
    ExtBool1 AS IsRecycled
  FROM lca_common.gs_ProcessCategoryMaster
  WHERE IndustryId = @industryId
`;

export const GET_PROCESS_MASTER_BY_INDUSTRY = `
  SELECT
    ProcessID,
    IndustryID,
    ProcessCategoryID,
    ProcessName,
    Description,
    IsMandatoryDefault,
    IsActive
  FROM lca_common.gs_ProcessMaster
  WHERE IndustryID = @industryId
  ORDER BY ProcessCategoryID, ProcessName
`;

export const GET_PROCESS_CATEGORY_MASTER_WITH_PROCESSES = `
SELECT
    pc.ProcessCategoryID,
    pc.IndustryId,
    pc.CategoryName,
    pc.Description,
    pc.ParentCategoryID,
    pc.IsActive,
    pc.ExtBool1 AS IsRecycled,

    pm.ProcessID,
    pm.ProcessName,
    pm.Description AS ProcessDescription,
    pm.IsMandatoryDefault,
    pm.IsActive AS ProcessIsActive
FROM lca_common.gs_ProcessCategoryMaster pc
LEFT JOIN lca_common.gs_ProcessMaster pm
    ON pm.ProcessCategoryID = pc.ProcessCategoryID
   AND pm.IndustryID = pc.IndustryId
WHERE pc.IndustryId = @industryId
ORDER BY pc.ProcessCategoryID, pm.ProcessName;
`;

export const GET_MY_PROCESS = `
  SELECT MyProcessId, TenantId, UserId, ProcessId, ActivityDescription, Amount
  FROM [LCA_MyProcess]
  WHERE TenantId = @TenantId AND UserId = @UserId
`;


export const ADD_MY_PROCESS = `
IF EXISTS (
    SELECT 1
    FROM LCA_MyProcess
    WHERE TenantId = @TenantId
      AND UserId = @UserId
      AND ProcessId = @ProcessId
)
BEGIN
    SELECT 0 AS Inserted
END
ELSE
BEGIN
    INSERT INTO LCA_MyProcess (TenantId, UserId, ProcessId, ActivityDescription)
    VALUES (@TenantId, @UserId, @ProcessId, @ActivityDescription)

    SELECT 1 AS Inserted
END
`;


export const DELETE_MY_PROCESS = `
DELETE FROM LCA_MyProcess
WHERE TenantId = @TenantId
  AND UserId = @UserId
  AND ProcessId = @ProcessId
`;

export const CREATE_SCENARIO = `
INSERT INTO LCA_MyScenario
(
    TenantId,
    UserId,
    ScenarioName,
    Description,
    Ext1,
    Ext2,
    Ext3,
    Ext4,
    Ext5,
    CreatedOn,
    ModifiedOn
)
OUTPUT
    INSERTED.ScenarioId,
    INSERTED.TenantId,
    INSERTED.UserId,
    INSERTED.ScenarioName,
    INSERTED.Description,
    INSERTED.Ext1,
    INSERTED.Ext2,
    INSERTED.Ext3,
    INSERTED.Ext4,
    INSERTED.Ext5,
    INSERTED.CreatedOn,
    INSERTED.ModifiedOn
VALUES
(
    @TenantId,
    @UserId,
    @ScenarioName,
    @Description,
    @Ext1,
    @Ext2,
    @Ext3,
    @Ext4,
    @Ext5,
    GETDATE(),
    GETDATE()
)
`;

export const GET_MY_SCENARIOS = `
SELECT
    ScenarioId,
    TenantId,
    UserId,
    ScenarioName,
    Description,
    Ext1,
    Ext2,
    Ext3,
    Ext4,
    Ext5,
    IsActive,
    CreatedOn,
    ModifiedOn
FROM LCA_MyScenario
WHERE TenantId = @TenantId
  AND UserId = @UserId
  AND IsActive = 1
ORDER BY ModifiedOn DESC, ScenarioId DESC
`;

export const GET_SCENARIO_BY_ID = `
SELECT
    ScenarioId,
    TenantId,
    UserId,
    ScenarioName,
    Description,
    Ext1,
    Ext2,
    Ext3,
    Ext4,
    Ext5,
    IsActive,
    CreatedOn,
    ModifiedOn
FROM LCA_MyScenario
WHERE TenantId = @TenantId
  AND UserId = @UserId
  AND ScenarioId = @ScenarioId
  AND IsActive = 1
`;

export const DELETE_SCENARIO = `
UPDATE LCA_MyScenario
SET
    IsActive = 0,
    ModifiedOn = GETDATE()
WHERE TenantId = @TenantId
  AND UserId = @UserId
  AND ScenarioId = @ScenarioId
  AND IsActive = 1
`;


export const UPSERT_SCENARIO_PROCESS = `
IF EXISTS (
    SELECT 1 FROM LCA_ScenarioProcess
    WHERE TenantId = @TenantId
      AND UserId = @UserId
      AND ScenarioId = @ScenarioId
      AND ProcessId = @ProcessId
)
BEGIN
    UPDATE LCA_ScenarioProcess
    SET 
        Amount = @Amount,
    ActivityDescription = @ActivityDescription,
    Notes = @Notes
    WHERE TenantId = @TenantId
      AND UserId = @UserId
      AND ScenarioId = @ScenarioId
      AND ProcessId = @ProcessId

    SELECT 1 AS Updated
END
ELSE
BEGIN
    INSERT INTO LCA_ScenarioProcess
    (
        TenantId,
        UserId,
        ScenarioId,
        ProcessId,
        Amount,
        ActivityDescription,
        Notes,
        CreatedOn
    )
    VALUES
    (
        @TenantId,
        @UserId,
        @ScenarioId,
        @ProcessId,
        @Amount,
        @ActivityDescription,
        @Notes,
        GETDATE()
    )

    SELECT 1 AS Inserted
END
`;

export const GET_SCENARIO_DETAILS = `
  SELECT *
  FROM LCA_ScenarioProcess
  WHERE TenantId = @TenantId
    AND UserId = @UserId
    AND (@ScenarioId IS NULL OR ScenarioId = @ScenarioId)
    AND EXISTS (
      SELECT 1
      FROM LCA_MyScenario
      WHERE LCA_MyScenario.TenantId = LCA_ScenarioProcess.TenantId
        AND LCA_MyScenario.UserId = LCA_ScenarioProcess.UserId
        AND LCA_MyScenario.ScenarioId = LCA_ScenarioProcess.ScenarioId
        AND LCA_MyScenario.IsActive = 1
    )
  ORDER BY ProcessId
`;

export const GET_SCENARIO_AI_WORKSPACE = `
SELECT TOP 1
    WorkspaceId,
    TenantId,
    UserId,
    ScenarioId,
    AssessmentJson,
    GoalScopeJson,
    AIInputJson,
    AIInsightsJson,
    ModelId,
    PromptVersion,
    Status,
    ErrorMessage,
    CreatedOn,
    ModifiedOn
FROM LCA_ScenarioAIWorkspace
WHERE TenantId = @TenantId
  AND UserId = @UserId
  AND ScenarioId = @ScenarioId
`;

export const UPSERT_SCENARIO_AI_WORKSPACE_ASSESSMENT = `
IF EXISTS (
    SELECT 1 FROM LCA_ScenarioAIWorkspace
    WHERE TenantId = @TenantId
      AND UserId = @UserId
      AND ScenarioId = @ScenarioId
)
BEGIN
    UPDATE LCA_ScenarioAIWorkspace
    SET
        AssessmentJson = @AssessmentJson,
        ModifiedOn = GETDATE(),
        Status = 'Draft',
        ErrorMessage = NULL
    WHERE TenantId = @TenantId
      AND UserId = @UserId
      AND ScenarioId = @ScenarioId;
END
ELSE
BEGIN
    INSERT INTO LCA_ScenarioAIWorkspace
    (
        TenantId,
        UserId,
        ScenarioId,
        AssessmentJson,
        Status,
        CreatedOn,
        ModifiedOn
    )
    VALUES
    (
        @TenantId,
        @UserId,
        @ScenarioId,
        @AssessmentJson,
        'Draft',
        GETDATE(),
        GETDATE()
    );
END

SELECT TOP 1 *
FROM LCA_ScenarioAIWorkspace
WHERE TenantId = @TenantId
  AND UserId = @UserId
  AND ScenarioId = @ScenarioId
`;

export const UPSERT_SCENARIO_AI_WORKSPACE_GOAL_SCOPE = `
IF EXISTS (
    SELECT 1 FROM LCA_ScenarioAIWorkspace
    WHERE TenantId = @TenantId
      AND UserId = @UserId
      AND ScenarioId = @ScenarioId
)
BEGIN
    UPDATE LCA_ScenarioAIWorkspace
    SET
        GoalScopeJson = @GoalScopeJson,
        ModifiedOn = GETDATE(),
        Status = 'Draft',
        ErrorMessage = NULL
    WHERE TenantId = @TenantId
      AND UserId = @UserId
      AND ScenarioId = @ScenarioId;
END
ELSE
BEGIN
    INSERT INTO LCA_ScenarioAIWorkspace
    (
        TenantId,
        UserId,
        ScenarioId,
        GoalScopeJson,
        Status,
        CreatedOn,
        ModifiedOn
    )
    VALUES
    (
        @TenantId,
        @UserId,
        @ScenarioId,
        @GoalScopeJson,
        'Draft',
        GETDATE(),
        GETDATE()
    );
END

SELECT TOP 1 *
FROM LCA_ScenarioAIWorkspace
WHERE TenantId = @TenantId
  AND UserId = @UserId
  AND ScenarioId = @ScenarioId
`;

export const UPSERT_SCENARIO_AI_WORKSPACE_INSIGHTS = `
IF EXISTS (
    SELECT 1 FROM LCA_ScenarioAIWorkspace
    WHERE TenantId = @TenantId
      AND UserId = @UserId
      AND ScenarioId = @ScenarioId
)
BEGIN
    UPDATE LCA_ScenarioAIWorkspace
    SET
        AIInputJson = @AIInputJson,
        AIInsightsJson = @AIInsightsJson,
        ModelId = @ModelId,
        PromptVersion = @PromptVersion,
        Status = @Status,
        ErrorMessage = NULL,
        ModifiedOn = GETDATE()
    WHERE TenantId = @TenantId
      AND UserId = @UserId
      AND ScenarioId = @ScenarioId;
END
ELSE
BEGIN
    INSERT INTO LCA_ScenarioAIWorkspace
    (
        TenantId,
        UserId,
        ScenarioId,
        AIInputJson,
        AIInsightsJson,
        ModelId,
        PromptVersion,
        Status,
        CreatedOn,
        ModifiedOn
    )
    VALUES
    (
        @TenantId,
        @UserId,
        @ScenarioId,
        @AIInputJson,
        @AIInsightsJson,
        @ModelId,
        @PromptVersion,
        @Status,
        GETDATE(),
        GETDATE()
    );
END

SELECT TOP 1 *
FROM LCA_ScenarioAIWorkspace
WHERE TenantId = @TenantId
  AND UserId = @UserId
  AND ScenarioId = @ScenarioId
`;
