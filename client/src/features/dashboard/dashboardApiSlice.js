import { apiSlice } from "../../app/apiSlice";

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query({
      query: () => "/sessions",
      providesTags: ["Session"],
    }),
    getSessionById: builder.query({
      query: (id) => `/sessions/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Session", id }],
    }),
    getDashboardStats: builder.query({
      query: () => "/dashboard/stats",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useGetSessionByIdQuery,
  useGetDashboardStatsQuery,
} = dashboardApiSlice;
