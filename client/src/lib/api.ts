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
    signup: async (name: string, email: string, password: string) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign up failed");
      }
      return response.json();
    },

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

    create: async (data: {
      name: string;
      email: string;
      currentYear: string;
      currentSem: string;
      stream?: string;
      currentGpa?: number | null;
      concentration?: string;
    }) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/students`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create student");
      }
      return response.json();
    },

    update: async (id: number, data: {
      name?: string;
      email?: string;
      currentYear?: string;
      currentSem?: string;
      stream?: string;
      currentGpa?: number | null;
      concentration?: string;
    }) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/students/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update student");
      }
      return response.json();
    },

    delete: async (id: number) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/students/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete student");
      }
      return response.json();
    },

    getCompleted: async (id: number) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/students/${id}/completed`);
      if (!response.ok) {
        throw new Error("Failed to fetch completed courses");
      }
      return response.json();
    },

    addCompleted: async (id: number, courses: { courseNo: string; grade: string }[]) => {
      const body = courses.length === 1 ? courses[0] : { courses };
      const response = await fetchWithCredentials(`${API_BASE_URL}/students/${id}/completed`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add completed course");
      }
      return response.json();
    },

    removeCompleted: async (id: number, courseNo: string) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/students/${id}/completed/${encodeURIComponent(courseNo)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove completed course");
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

  courses: {
    getGenEd: async (category: string) => {
      const response = await fetchWithCredentials(`${API_BASE_URL}/courses/gened/${encodeURIComponent(category)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch GenEd courses");
      }
      return response.json();
    },
  },
};
