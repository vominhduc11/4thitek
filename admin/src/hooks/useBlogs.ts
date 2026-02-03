import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { blogApi } from "@/services/api";
import { BlogResponse, BlogCategory, BlogCreateRequest, BlogCategoryCreateRequest } from "@/types";
import { logger } from "@/utils/logger";

type ViewMode = "active" | "trash";

type BlogsState = {
  blogs: BlogResponse[];
  deletedBlogs: BlogResponse[];
  categories: BlogCategory[];
  searchTerm: string;
  viewMode: ViewMode;
  loading: boolean;
  categoryLoading: boolean;
  dialogOpen: boolean;
  editingBlog: BlogResponse | null;
  confirmDelete: { open: boolean; blogId: number; blogTitle: string; isHardDelete: boolean };
  categoryDialogOpen: boolean;
  creatingCategory: boolean;
  showCreateCategoryForm: boolean;
  deletingCategoryId: number | null;
  error: string | null;
};

type BlogsAction =
  | { type: "SET_BLOGS"; payload: BlogResponse[] }
  | { type: "SET_DELETED"; payload: BlogResponse[] }
  | { type: "SET_CATEGORIES"; payload: BlogCategory[] }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CATEGORY_LOADING"; payload: boolean }
  | { type: "SET_DIALOG_OPEN"; payload: boolean }
  | { type: "SET_EDITING_BLOG"; payload: BlogResponse | null }
  | { type: "SET_CONFIRM_DELETE"; payload: BlogsState["confirmDelete"] }
  | { type: "SET_CATEGORY_DIALOG_OPEN"; payload: boolean }
  | { type: "SET_CREATING_CATEGORY"; payload: boolean }
  | { type: "SET_SHOW_CREATE_CATEGORY_FORM"; payload: boolean }
  | { type: "SET_DELETING_CATEGORY_ID"; payload: number | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_BLOG"; payload: BlogResponse }
  | { type: "ADD_BLOG"; payload: BlogResponse }
  | { type: "DELETE_BLOG"; payload: number }
  | { type: "RESTORE_BLOG"; payload: BlogResponse }
  | { type: "HARD_DELETE_BLOG"; payload: number };

const initialState: BlogsState = {
  blogs: [],
  deletedBlogs: [],
  categories: [],
  searchTerm: "",
  viewMode: "active",
  loading: false,
  categoryLoading: false,
  dialogOpen: false,
  editingBlog: null,
  confirmDelete: { open: false, blogId: 0, blogTitle: "", isHardDelete: false },
  categoryDialogOpen: false,
  creatingCategory: false,
  showCreateCategoryForm: false,
  deletingCategoryId: null,
  error: null,
};

function reducer(state: BlogsState, action: BlogsAction): BlogsState {
  switch (action.type) {
    case "SET_BLOGS":
      return { ...state, blogs: action.payload };
    case "SET_DELETED":
      return { ...state, deletedBlogs: action.payload };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_CATEGORY_LOADING":
      return { ...state, categoryLoading: action.payload };
    case "SET_DIALOG_OPEN":
      return { ...state, dialogOpen: action.payload };
    case "SET_EDITING_BLOG":
      return { ...state, editingBlog: action.payload };
    case "SET_CONFIRM_DELETE":
      return { ...state, confirmDelete: action.payload };
    case "SET_CATEGORY_DIALOG_OPEN":
      return { ...state, categoryDialogOpen: action.payload };
    case "SET_CREATING_CATEGORY":
      return { ...state, creatingCategory: action.payload };
    case "SET_SHOW_CREATE_CATEGORY_FORM":
      return { ...state, showCreateCategoryForm: action.payload };
    case "SET_DELETING_CATEGORY_ID":
      return { ...state, deletingCategoryId: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "UPDATE_BLOG":
      return {
        ...state,
        blogs: state.blogs.map((b) => (b.id === action.payload.id ? action.payload : b)),
      };
    case "ADD_BLOG":
      return { ...state, blogs: [action.payload, ...state.blogs] };
    case "DELETE_BLOG":
      return { ...state, blogs: state.blogs.filter((b) => b.id !== action.payload) };
    case "RESTORE_BLOG":
      return { ...state, blogs: [action.payload, ...state.blogs] };
    case "HARD_DELETE_BLOG":
      return { ...state, deletedBlogs: state.deletedBlogs.filter((b) => b.id !== action.payload) };
    default:
      return state;
  }
}

export function useBlogs() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const debouncedSearch = useDebounce(state.searchTerm, 300);

  const loadCategories = useCallback(async () => {
    dispatch({ type: "SET_CATEGORY_LOADING", payload: true });
    try {
      const response = await blogApi.getCategories();
      dispatch({ type: "SET_CATEGORIES", payload: response.data });
    } catch (error) {
      logger.error("Load categories failed", error);
      dispatch({ type: "SET_ERROR", payload: "Không tải được danh mục" });
    } finally {
      dispatch({ type: "SET_CATEGORY_LOADING", payload: false });
    }
  }, []);

  const loadBlogs = useCallback(
    async (isSearch = false) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const response = isSearch && debouncedSearch
          ? await blogApi.search(debouncedSearch)
          : await blogApi.getAll();

        const deletedResponse = await blogApi.getDeleted();

        dispatch({ type: "SET_BLOGS", payload: response.data || [] });
        dispatch({ type: "SET_DELETED", payload: deletedResponse.data || [] });
      } catch (error) {
        logger.error("Load blogs failed", error);
        dispatch({ type: "SET_ERROR", payload: "Không tải được bài viết" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [debouncedSearch]
  );

  const handleSearch = useCallback(
    (value: string) => {
      dispatch({ type: "SET_SEARCH_TERM", payload: value });
    },
    [dispatch]
  );

  const filteredBlogs = useMemo(() => {
    const list = state.viewMode === "active" ? state.blogs : state.deletedBlogs;
    if (!debouncedSearch) return list;
    const term = debouncedSearch.toLowerCase();
    return list.filter(
      (blog) =>
        blog.title.toLowerCase().includes(term) ||
        blog.description.toLowerCase().includes(term) ||
        blog.introduction.some((i) => i.text?.toLowerCase().includes(term))
    );
  }, [state.blogs, state.deletedBlogs, state.viewMode, debouncedSearch]);

  useEffect(() => {
    loadCategories();
    loadBlogs();
  }, [loadCategories, loadBlogs]);

  useEffect(() => {
    if (state.viewMode === "active") {
      loadBlogs(true);
    }
  }, [debouncedSearch, state.viewMode, loadBlogs]);

  const addBlog = async (data: BlogCreateRequest) => {
    const response = await blogApi.create(data);
    if (response.data) {
      dispatch({ type: "ADD_BLOG", payload: response.data });
    }
    return response;
  };

  const updateBlog = async (id: number, data: BlogCreateRequest) => {
    const response = await blogApi.update(id, data);
    if (response.data) {
      dispatch({ type: "UPDATE_BLOG", payload: response.data });
    }
    return response;
  };

  const deleteBlog = async (id: number, hard = false) => {
    const response = hard ? await blogApi.hardDelete(id) : await blogApi.delete(id);
    if (response.success) {
      dispatch({ type: hard ? "HARD_DELETE_BLOG" : "DELETE_BLOG", payload: id });
    }
    return response;
  };

  const restoreBlog = async (id: number) => {
    const response = await blogApi.restore(id);
    if (response.data) {
      dispatch({ type: "RESTORE_BLOG", payload: response.data });
    }
    return response;
  };

  const createCategory = async (data: BlogCategoryCreateRequest) => {
    const response = await blogApi.createCategory(data);
    if (response.data) {
      await loadCategories();
    }
    return response;
  };

  const deleteCategory = async (id: number) => {
    await blogApi.deleteCategory(id);
    await loadCategories();
  };

  return {
    state,
    dispatch,
    loadBlogs,
    loadCategories,
    handleSearch,
    filteredBlogs,
    addBlog,
    updateBlog,
    deleteBlog,
    restoreBlog,
    createCategory,
    deleteCategory,
  };
}
