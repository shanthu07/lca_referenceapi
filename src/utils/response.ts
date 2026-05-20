export interface ErrorMeta {
	message: string;
	field?: string | null;
}

export const errorCodeMap: Record<string, ErrorMeta> = {
	INVALID_CATEGORY: {
		message: "The selected category is missing, inactive, or invalid. Please choose a valid category.",
		field: "CategoryID",
	},
	FACTOR_NAME_REQUIRED: {
		message: "Please enter an emission factor name before saving.",
		field: "FactorName",
	},
	INVALID_EF_TYPE: {
		message: "Please choose Activity or Spend.",
		field: "EF_Type",
	},
	EF_VALUE_REQUIRED: {
		message: "Please enter the CO2e emission value.",
		field: "EF_CO2e",
	},
	INVALID_DATE_RANGE: {
		message: "Effective To date cannot be earlier than Effective From.",
		field: "EffectiveTo",
	},
	UNIT_REQUIRED: {
		message: "A unit is required for Activity type.",
		field: "EF_UnitID",
	},
	CURRENCY_REQUIRED: {
		message: "A currency is required for Spend type.",
		field: "CurrencyCode",
	},
	COUNTRY_REQUIRED: {
		message: "Please select a country.",
		field: "CountryID",
	},
	STATE_REQUIRED: {
		message: "Please select a state.",
		field: "StateID",
	},
	CITY_REQUIRED: {
		message: "Please select a city.",
		field: "CityID",
	},
	TENANT_REQUIRED: {
		message: "Please select a tenant/company.",
		field: "TenantID",
	},
	MIX_REQUIRED: {
		message: "Add at least one mix row for composite factors.",
		field: "Mix",
	},
	DUPLICATE_MIX_COMPONENT: {
		message: "Duplicate mix components are not allowed.",
		field: "Mix",
	},
	INVALID_MIX_TOTAL: {
		message: "Mix percentages must total exactly 100%.",
		field: "Mix",
	},
	FACTOR_ALREADY_EXISTS: {
		message: "A matching factor already exists for the selected date.",
	},
	INVALID_FACTOR: {
		message: "The requested factor record was not found.",
	},
};

export function getErrorMeta(code?: string) {
	if (!code) {
		return null;
	}

	return errorCodeMap[code] ?? null;
}

export function successResponse(data: any, message = "Success") {
	return {
		success: true,
		message,
		data,
	};
}

export function errorResponse(
	message = "Error",
	data: any = null,
	code?: string,
	field?: string | null,
) {
	return {
		success: false,
		message,
		code,
		field: field ?? null,
		data,
	};
}
