export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};

export const api = {
  auth: {
    signin: async (email: string, password: string) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign in failed");
      }
      return response.json();
    },

    signout: async () => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/auth/signout`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Sign out failed");
      }
      return response.json();
    },
  },

  students: {
    getAll: async () => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/students`);
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      return response.json();
    },

    getById: async (id: number) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/students/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch student details");
      }
      return response.json();
    },
  },

  suggestions: {
    get: async (studentId: number) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/students/${studentId}/suggestions`);
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      return response.json();
    },
  },
};
