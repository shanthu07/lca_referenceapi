import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { successResponse } from "../../../utils/response";
import sql, { getPool } from "../../../config/db";

export const getEmissionFactorReferenceData = asyncHandler(
  async (_req: Request, res: Response) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .execute("lca_common.gs_GetEmissionFactorReferenceData");

    const recordsets = Array.isArray(result.recordsets)
      ? result.recordsets
      : [];

    // console.log("Recordsets:", recordsets);

    const categoryTypes = recordsets[0] ?? [];
    const categories = recordsets[1] ?? [];
    const sources = recordsets[2] ?? [];
    const scopeLevels = recordsets[3] ?? [];
    const mixComponents = recordsets[4] ?? [];

    res.json(
      successResponse(
        {
          categoryTypes,
          categories,
          sources,
          scopeLevels,
          mixComponents,
          // recordsets,
        },
        "Emission factor reference data fetched",
      ),
    );
  },
);

export const getEmissionFactorDashbaord = asyncHandler(
  async (_req: Request, res: Response) => {
    const pool = await getPool();

    const result = await pool
      .request()
      .execute("lca_common.gs_GetEmissionFactorDashboard");

    const recordsets = Array.isArray(result.recordsets)
      ? result.recordsets
      : [];

    const [
      summaryCards = [],
      scopeDistribution = [],
      typeDistribution = [],
      topSources = [],
      recentlyModified = [],
    ] = recordsets;

    // console.log("Recordsets:", recordsets);

    res.json(
      successResponse(
        {
          summary: summaryCards[0] ?? {},
          scopeDistribution,
          typeDistribution,
          topSources,
          recentlyModified,
        },
        "Emission factor dashboard data fetched",
      ),
    );
  },
);

export const getEmissionFactorList = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      searchText = null,
      efType = null,
      scopeLevel = null,
      isActive = null,
      sourceId = null,
      pageNo = 1,
      pageSize = 20,
    } = req.query;

    const pool = await getPool();

    const result = await pool
      .request()
      .input("SearchText", searchText)
      .input("EFType", efType)
      .input("ScopeLevel", scopeLevel)
      .input(
        "IsActive",
        isActive !== null && isActive !== undefined ? Number(isActive) : null,
      )
      .input("SourceID", sourceId ? Number(sourceId) : null)
      .input("PageNo", Number(pageNo))
      .input("PageSize", Number(pageSize))
      .execute("lca_common.gs_GetEmissionFactorList");

    const rows = result.recordset ?? [];

    const totalRecords = rows.length > 0 ? rows[0].TotalRecords : 0;

    res.json(
      successResponse(
        {
          items: rows,
          pagination: {
            pageNo: Number(pageNo),
            pageSize: Number(pageSize),
            totalRecords,
            totalPages: Math.ceil(totalRecords / Number(pageSize)),
          },
        },
        "Emission factor list fetched",
      ),
    );
  },
);

export const getEmissionFactorSetup = asyncHandler(
  async (req: Request, res: Response) => {
    const { mode, id } = req.query;

    const pool = await getPool();

    const result = await pool
      .request()
      .input("Mode", mode)
      .input("FactorID", id ? Number(id) : null)
      .execute("lca_common.gs_GetEmissionFactorSetup");

    const recordsets = Array.isArray(result.recordsets)
      ? result.recordsets
      : [];

    const [factorDetails = [], mixDetails = [], uiMeta = []] = recordsets;

    res.json(
      successResponse(
        {
          factor: factorDetails[0] ?? null,

          mixDetails,

          uiMeta: uiMeta[0] ?? {},
        },
        "Emission factor setup fetched",
      ),
    );
  },
);

export const saveEmissionFactor = asyncHandler(
  async (req: Request, res: Response) => {
    const pool = await getPool();

    const { Mix = [] } = req.body;

    // ----------------------------
    // TVP
    // ----------------------------
    const tvp = new sql.Table("lca_common.tt_EmissionFactorMix");

    tvp.columns.add("ComponentName", sql.NVarChar(150));
    tvp.columns.add("Percentage", sql.Decimal(9, 4));
    tvp.columns.add("SortOrder", sql.Int);

    if (Array.isArray(Mix)) {
      Mix.forEach((m: any) => {
        tvp.rows.add(
          m.ComponentName ?? null,
          Number(m.Percentage ?? 0),
          m.SortOrder ?? 0,
        );
      });
    }

    const request = pool.request();

    // ----------------------------
    // PARAMS
    // ----------------------------
    request.input("FactorID", req.body.FactorID ?? null);

    request.input("CategoryID", req.body.CategoryID);
    request.input("FactorName", req.body.FactorName);

    request.input("EF_Type", req.body.EF_Type);

    request.input("EF_CO2", req.body.EF_CO2 ?? 0);
    request.input("EF_CH4", req.body.EF_CH4 ?? 0);
    request.input("EF_N2O", req.body.EF_N2O ?? 0);
    request.input("EF_CO2e", req.body.EF_CO2e);

    request.input("EF_UnitID", req.body.EF_UnitID ?? null);
    request.input("CurrencyCode", req.body.CurrencyCode ?? null);

    request.input("ScopeLevel", req.body.ScopeLevel);

    request.input("RegionID", req.body.RegionID ?? null);
    request.input("CountryID", req.body.CountryID ?? null);
    request.input("StateID", req.body.StateID ?? null);
    request.input("CityID", req.body.CityID ?? null);
    request.input("TenantID", req.body.TenantID ?? null);

    request.input("SourceID", req.body.SourceID ?? null);
    request.input("ProcessID", req.body.ProcessID ?? null);
    request.input("IndustryID", req.body.IndustryID ?? null);
    request.input("ProductID", req.body.ProductID ?? null);

    request.input("IsCompositeFactor", req.body.IsCompositeFactor ?? false);

    request.input("Note", req.body.Note ?? null);

    request.input("EffectiveFrom", req.body.EffectiveFrom);
    request.input("EffectiveTo", req.body.EffectiveTo ?? null);

    request.input("IsActive", req.body.IsActive ?? true);

    // TVP
    request.input("Mix", tvp);

    // ----------------------------
    // EXECUTE
    // ----------------------------
    const result = await request.execute("lca_common.gs_UpsertEmissionFactor");

    const recordsets = Array.isArray(result.recordsets)
      ? result.recordsets
      : [];

    const [saveResult = [], auditLogs = []] = recordsets;

    const response = saveResult[0] ?? {};

    if (response?.Success === 0) {
      return res
        .status(400)
        .json(
          successResponse(
            { result: response, auditLogs },
            response?.ErrorMessage || "Save failed",
          ),
        );
    }

    return res.json(
      successResponse(
        { result: response, auditLogs },
        "Emission factor saved successfully",
      ),
    );
  },
);

export const deleteEmissionFactor = asyncHandler(
  async (req: Request, res: Response) => {
    const factorID = Number(req.params.id);

    if (!factorID) {
      throw new Error("FactorID is required");
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("FactorID", factorID)
      .execute("lca_common.gs_DeleteEmissionFactor");

    const recordsets = Array.isArray(result.recordsets)
      ? result.recordsets
      : [];

    const deleteResult = recordsets[0] ?? [];
    const auditLogs = recordsets[1] ?? [];

    res.json(
      successResponse(
        {
          result: deleteResult[0] ?? {},
          auditLogs,
        },
        "Emission factor deleted successfully",
      ),
    );
  },
);
