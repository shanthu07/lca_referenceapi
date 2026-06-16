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
    IsActive
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