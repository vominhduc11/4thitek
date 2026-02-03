import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useBlogs } from "@/hooks/useBlogs";
import { BlogsStats } from "./blogs/BlogsStats";
import { BlogsToolbar } from "./blogs/BlogsToolbar";
import { DescriptionEditor } from "./DescriptionEditor";
import { ImageUpload } from "./ImageUpload";
import { BlogCreateRequest, BlogResponse, BlogIntroductionItem, BlogImageData } from "@/types";
import { DEFAULT_ITEMS_PER_PAGE } from "@/constants/business";
import { staggerContainer } from "@/lib/animations";
import { logger } from "@/utils/logger";
import { BlogDeleteDialog } from "./BlogDeleteDialog";
import { BlogDetailModal } from "./BlogDetailModal";

const blogSchema = z.object({
  title: z.string().min(3, "Tiêu đề phải có ít nhất 3 ký tự"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
  introduction: z.array(
    z.object({
      type: z.string(),
      text: z.string().optional(),
      imageUrl: z.string().optional(),
      caption: z.string().optional(),
      images: z.array(z.object({ url: z.string() })).optional(),
    })
  ).optional(),
  categoryId: z.number().optional(),
  showOnHomepage: z.boolean().optional(),
  image: z.union([
    z.string(),
    z.object({
      public_id: z.string().optional(),
      imageUrl: z.string().optional(),
      url: z.string().optional(),
    })
  ]).optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export function BlogsPage() {
  const { toast } = useToast();
  const {
    state,
    dispatch,
    filteredBlogs,
    handleSearch,
    loadBlogs,
    loadCategories,
    addBlog,
    updateBlog,
    deleteBlog,
    restoreBlog,
    createCategory,
    deleteCategory,
  } = useBlogs();

  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ blog?: BlogResponse; hard?: boolean }>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [homepageFilter, setHomepageFilter] = useState<"all" | "home" | "hidden">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title-asc" | "title-desc">("newest");
  const [detailBlog, setDetailBlog] = useState<BlogResponse | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<{ id: number; name: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const pageSize = DEFAULT_ITEMS_PER_PAGE || 10;

  const filteredWithExtras = useMemo(() => {
    return filteredBlogs
      .filter((b) => selectedCategory === "all" || String(b.categoryId ?? "") === selectedCategory)
      .filter((b) =>
        homepageFilter === "all"
          ? true
          : homepageFilter === "home"
            ? b.showOnHomepage
            : !b.showOnHomepage
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          case "oldest":
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          case "newest":
          default:
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
      });
  }, [filteredBlogs, selectedCategory, homepageFilter, sortBy]);

  const pagedBlogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredWithExtras.slice(start, end);
  }, [filteredWithExtras, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredWithExtras.length / pageSize));

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      description: "",
      introduction: [],
      categoryId: undefined,
      showOnHomepage: false,
    },
  });

  const openCreate = () => {
    loadCategories();
    dispatch({ type: "SET_EDITING_BLOG", payload: null });
    form.reset({
      title: "",
      description: "",
      introduction: [],
      categoryId: undefined,
      showOnHomepage: false,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (blog: BlogResponse) => {
    loadCategories();
    dispatch({ type: "SET_EDITING_BLOG", payload: blog });
    form.reset({
      title: blog.title,
      description: blog.description,
      introduction: blog.introduction,
      categoryId: blog.categoryId,
      showOnHomepage: blog.showOnHomepage,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: BlogFormValues) => {
    try {
      const payload: BlogCreateRequest = {
        ...values,
        introduction: values.introduction || [],
        image: values.image,
      };

      if (state.editingBlog) {
        await updateBlog(state.editingBlog.id, payload);
        toast({ title: "Đã cập nhật bài viết" });
      } else {
        await addBlog(payload);
        toast({ title: "Đã tạo bài viết mới" });
      }

      setIsDialogOpen(false);
      await loadBlogs();
    } catch (error) {
      logger.error("Save blog failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu bài viết",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (blog: BlogResponse, hard = false) => {
    await deleteBlog(blog.id, hard);
    toast({
      title: hard ? "Đã xóa vĩnh viễn" : "Đã chuyển vào thùng rác",
      description: blog.title,
    });
    await loadBlogs();
  };

  const handleRestore = async (blog: BlogResponse) => {
    await restoreBlog(blog.id);
    toast({ title: "Đã khôi phục", description: blog.title });
    await loadBlogs();
  };

  const currentBlogs = viewMode === "active" ? pagedBlogs : state.deletedBlogs;

  const homepageCount = state.blogs.filter((b) => b.showOnHomepage).length;
  const selectedCount = selectedIds.size;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pagedBlogs.map((b) => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const openCategoryManager = () => {
    loadCategories();
    setCategoryDialogOpen(true);
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast({ title: "Thiếu tên danh mục", description: "Vui lòng nhập tên danh mục.", variant: "destructive" });
      return;
    }

    setCreatingCategory(true);
    try {
      await createCategory({
        name,
        description: newCategoryDescription.trim() || undefined,
      });
      toast({ title: "Đã tạo danh mục", description: name });
      setNewCategoryName("");
      setNewCategoryDescription("");
    } catch (error) {
      logger.error("Create category failed", error);
      toast({ title: "Lỗi", description: "Không thể tạo danh mục.", variant: "destructive" });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!pendingDeleteCategory) return;
    setDeletingCategory(true);
    try {
      await deleteCategory(pendingDeleteCategory.id);
      toast({ title: "Đã xóa danh mục", description: pendingDeleteCategory.name });
      if (selectedCategory === String(pendingDeleteCategory.id)) {
        setSelectedCategory("all");
      }
    } catch (error) {
      logger.error("Delete category failed", error);
      toast({ title: "Lỗi", description: "Không thể xóa danh mục.", variant: "destructive" });
    } finally {
      setDeletingCategory(false);
      setPendingDeleteCategory(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Blogs</h1>
          <p className="text-muted-foreground">Tạo, cập nhật, khôi phục và xóa bài viết.</p>
        </div>
      </div>

      <BlogsStats
        activeCount={state.blogs.length}
        deletedCount={state.deletedBlogs.length}
        homepageCount={homepageCount}
        loading={state.loading}
      />

      <BlogsToolbar
        searchTerm={state.searchTerm}
        onSearchChange={(value) => {
          handleSearch(value);
          setCurrentPage(1);
        }}
        onAdd={openCreate}
        onFilter={() => loadCategories()}
        onManageCategories={openCategoryManager}
        viewMode={viewMode}
        onToggleViewMode={() => {
          setViewMode((prev) => (prev === "active" ? "trash" : "active"));
          setCurrentPage(1);
          setSelectedIds(new Set());
        }}
        categories={state.categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(v) => {
          setSelectedCategory(v);
          setCurrentPage(1);
        }}
        homepageFilter={homepageFilter}
        onHomepageFilterChange={(v) => {
          setHomepageFilter(v as any);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortChange={(v) => {
          setSortBy(v as any);
          setCurrentPage(1);
        }}
        selectedCount={selectedCount}
        onBulkDelete={() => {
          if (selectedCount === 0) {
            toast({ title: "Chưa chọn bài viết", description: "Hãy chọn ít nhất 1 bài để xóa.", variant: "destructive" });
            return;
          }
          setPendingDelete({ hard: viewMode === "trash" });
          setDeleteDialogOpen(true);
        }}
        onBulkRestore={
          viewMode === "trash"
            ? async () => {
                if (selectedCount === 0) {
                  toast({ title: "Chưa chọn bài viết", description: "Hãy chọn ít nhất 1 bài để khôi phục.", variant: "destructive" });
                  return;
                }
                await Promise.all(Array.from(selectedIds).map((id) => handleRestore(state.deletedBlogs.find((b) => b.id === id)!)));
                setSelectedIds(new Set());
              }
            : undefined
        }
      />

      <motion.div
        className="rounded-lg border border-muted"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={pagedBlogs.length > 0 && selectedIds.size === pagedBlogs.length}
                  onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                />
              </TableHead>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Hiển thị</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : currentBlogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Không có bài viết nào
                </TableCell>
              </TableRow>
            ) : (
              currentBlogs.map((blog) => (
                <TableRow key={blog.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(blog.id)}
                      onCheckedChange={(checked) => toggleSelect(blog.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {blog.image ? (
                      <img
                        src={typeof blog.image === "string" ? blog.image : blog.image.imageUrl || blog.image.url}
                        alt={blog.title}
                        className="w-14 h-14 rounded object-cover border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No img
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{blog.title}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2 text-muted-foreground">{blog.description}</p>
                  </TableCell>
                  <TableCell>{state.categories.find((c) => c.id === blog.categoryId)?.name || "—"}</TableCell>
                  <TableCell>{blog.showOnHomepage ? "Trang chủ" : "Ẩn"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString("vi-VN") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {viewMode === "trash" ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleRestore(blog)}>Khôi phục</Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setPendingDelete({ blog, hard: true });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Xóa vĩnh viễn
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEdit(blog)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDetailBlog(blog)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setPendingDelete({ blog, hard: false });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Hiển thị {currentBlogs.length} / {filteredBlogs.length} bài
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <span className="text-sm">
              Trang {currentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle>{state.editingBlog ? "Chỉnh sửa bài viết" : "Tạo bài viết"}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Điền thông tin bài viết</p>
                  <p className="text-xs text-muted-foreground">Trường bắt buộc có dấu *</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Tiêu đề <span className="text-destructive">*</span>
                    </label>
                    <Input {...form.register("title")} required />
                    {form.formState.errors.title && (
                      <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Mô tả ngắn <span className="text-destructive">*</span>
                    </label>
                    <Textarea rows={4} {...form.register("description")} required />
                    <p className="text-xs text-muted-foreground">1-3 câu tóm tắt để hiển thị trong danh sách.</p>
                    {form.formState.errors.description && (
                      <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Danh mục</label>
                    <Select
                      value={form.watch("categoryId")?.toString()}
                      onValueChange={(val) => form.setValue("categoryId", Number(val))}
                      disabled={state.categoryLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={state.categoryLoading ? "Đang tải danh mục..." : "Chọn danh mục"} />
                      </SelectTrigger>
                      <SelectContent>
                        {state.categoryLoading ? (
                          <SelectItem value="loading" disabled>
                            Đang tải...
                          </SelectItem>
                        ) : (
                          state.categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Chọn danh mục để nhóm bài viết.</p>
                  </div>

                  <div className="flex items-center space-x-2 rounded-md border px-3 py-2 bg-background">
                    <Checkbox
                      id="showOnHomepage"
                      checked={form.watch("showOnHomepage")}
                      onCheckedChange={(checked) => form.setValue("showOnHomepage", Boolean(checked))}
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="showOnHomepage" className="text-sm font-medium">
                        Hiển thị trên trang chủ
                      </label>
                      <p className="text-xs text-muted-foreground">Gắn badge “Trang chủ” và ưu tiên hiển thị.</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <ImageUpload
                      value={(state.editingBlog?.image as BlogImageData | string | undefined) ?? ""}
                      onChange={(val) => form.setValue("image", val)}
                      label="Ảnh đại diện"
                    />
                    <p className="text-xs text-muted-foreground">Ảnh ngang, tối ưu 1200x630px cho chia sẻ.</p>
                  </div>
                </div>

                <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Nội dung giới thiệu</label>
                    <span className="text-xs text-muted-foreground">Thêm đoạn văn, ảnh, bộ ảnh</span>
                  </div>
                  <DescriptionEditor
                    value={(form.watch("introduction") as BlogIntroductionItem[]) || []}
                    onChange={(val) => form.setValue("introduction", val)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t sticky bottom-0 bg-background/95 backdrop-blur">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {state.editingBlog ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quản lý danh mục</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Tạo danh mục mới</p>
                <p className="text-xs text-muted-foreground">Tên danh mục là bắt buộc.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tên danh mục</label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ví dụ: Tin tức"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Mô tả</label>
                  <Textarea
                    rows={3}
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Mô tả ngắn cho danh mục (tùy chọn)"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={handleCreateCategory} disabled={creatingCategory}>
                  {creatingCategory && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creatingCategory ? "Đang tạo..." : "Thêm danh mục"}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Danh sách danh mục</h3>
                <span className="text-xs text-muted-foreground">{state.categories.length} mục</span>
              </div>
              <div className="rounded-lg border divide-y">
                {state.categoryLoading ? (
                  <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải danh mục...
                  </div>
                ) : state.categories.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Chưa có danh mục nào.</div>
                ) : (
                  state.categories.map((category) => (
                    <div key={category.id} className="flex items-start justify-between gap-3 p-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.description || "Chưa có mô tả"}</p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setPendingDeleteCategory({ id: category.id, name: category.name })}
                        disabled={deletingCategory}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDeleteCategory}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteCategory(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteCategory
                ? `Danh mục "${pendingDeleteCategory.name}" sẽ bị xóa. Bạn chắc chắn chứ?`
                : "Danh mục sẽ bị xóa. Bạn chắc chắn chứ?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCategory}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteCategory}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deletingCategory}
            >
              {deletingCategory ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BlogDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          setDeleteDialogOpen(false);
          if (pendingDelete.blog) {
            await handleDelete(pendingDelete.blog, pendingDelete.hard);
          }
        }}
        hardDelete={pendingDelete.hard}
        title={pendingDelete.blog?.title}
        count={pendingDelete.hard ? selectedIds.size || 1 : selectedIds.size || 1}
      />

      <BlogDetailModal
        isOpen={!!detailBlog}
        onClose={() => setDetailBlog(null)}
        blog={detailBlog}
      />
    </div>
  );
}
