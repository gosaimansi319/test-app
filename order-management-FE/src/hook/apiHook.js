import axios from "axios";
import toast from "react-hot-toast";

function getToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}

export async function usePatchApiFormData(url, formData) {
  try {
    const token = getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    };
    const response = await axios.patch(url, formData, { headers });
    return response;
  } catch (error) {
    return error;
  }
}

export async function usePatchApi(url, data) {
  try {
    const token = getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const response = await axios.patch(url, data, { headers });
    return response;
  } catch (error) {
    return error;
  }
}


export async function useGetApi(url) {
  try {
    const token = getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await axios.get(url, { headers });
    return response;
  } catch (error) {
    if (error.message === "Network Error") {
      toast.error("Server Error");
    } else if (error.response?.data?.status_code === 401) {
      toast.error(error.response.data.message);
    }
    return error;
  }
}

export async function usePostApi(url, data, isFormData = false) {
  try {
    const token = getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(isFormData && { "Content-Type": "multipart/form-data" }),
    };
    const response = await axios.post(url, data, { headers });
    return response;
  } catch (error) {
    if (error.message === "Network Error") {
      toast.error("Server Error");
    } else if (error.response?.data?.status_code === 401) {
      toast.error(error.response.data.message);
    }
    return error;
  }
}

export async function usePutApi(url, data, isFormData = false) {
  try {
    const token = getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(isFormData && { "Content-Type": "multipart/form-data" }),
    };
    const response = await axios.put(url, data, { headers });
    return response;
  } catch (error) {
    if (error.message === "Network Error") {
      toast.error("Server Error");
    } else if (error.response?.data?.status_code === 401) {
      toast.error(error.response.data.message);
    }
    return error;
  }
}

export async function useDeleteApi(url) {
  try {
    const token = getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await axios.delete(url, { headers });
    return response;
  } catch (error) {
    if (error.message === "Network Error") {
      toast.error("Server Error");
    } else if (error.response?.data?.status_code === 401) {
      toast.error(error.response.data.message);
    }
    return error;
  }
}
