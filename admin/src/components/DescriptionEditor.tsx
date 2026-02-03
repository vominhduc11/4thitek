import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { BlogIntroductionItem } from "@/types";
import { ImageUpload } from "./ImageUpload";
import { MultipleImageUpload } from "./MultipleImageUpload";
import { uploadService } from "@/services/uploadService";
import ReactQuill from 'react-quill';
import DOMPurify from 'dompurify';
import { logger } from '@/utils/logger';

interface DescriptionEditorProps {
  value: BlogIntroductionItem[];
  onChange: (items: BlogIntroductionItem[]) => void;
}

export function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Helper function to extract YouTube video ID from URL or iframe
  const getYouTubeVideoId = (input: string): string | null => {
    if (!input) return null;

    // If input contains iframe tag, extract src attribute first
    if (input.includes('<iframe')) {
      const srcMatch = input.match(/src=["']([^"']+)["']/);
      if (srcMatch) {
        input = srcMatch[1]; // Use the src URL
      }
    }

    // Support youtube.com, youtu.be, and embed URLs
    // eslint-disable-next-line no-useless-escape
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = input.match(regex);
    return match ? match[1] : null;
  };

  // Helper function to get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  const addItem = () => {
    const newItem: BlogIntroductionItem = {
      type: 'description',
      text: ''
    };
    onChange([...value, newItem]);
    setEditingIndex(value.length);
  };

  const removeItem = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange(newItems);
    setEditingIndex(null);
  };

  const updateItem = (index: number, updates: Partial<BlogIntroductionItem>) => {
    const newItems = value.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    onChange(newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...value];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      onChange(newItems);
    }
  };

  const renderPreview = (item: BlogIntroductionItem, index: number) => {
    switch (item.type) {
      case 'title':
        return <h3 className="text-lg font-semibold text-gray-900">{item.text || 'Tiêu đề trống'}</h3>;
      case 'description':
        return <div className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.text || 'Mô tả trống') }} />;
      case 'image':
        return (
          <div className="text-sm text-blue-600">
            <span className="font-medium">Hình ảnh</span>
            {item.imageUrl && (
              <>
                <br />
                <img src={item.imageUrl} alt="Preview" className="mt-2 max-w-32 h-20 object-cover rounded" />
                {item.caption && (
                  <div className="mt-1 text-xs text-gray-600 italic">
                    "{item.caption}"
                  </div>
                )}
                <br />
                <span className="text-gray-500">Public ID: {item.public_id}</span>
              </>
            )}
          </div>
        );
      case 'images':
        return (
          <div className="text-sm text-blue-600">
            <span className="font-medium">Nhiều hình ảnh ({item.images?.length || 0})</span>
            {item.images && item.images.length > 0 && (
              <>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {item.images.map((img, idx) => (
                    <img key={idx} src={img.url} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                  ))}
                </div>
                {item.caption && (
                  <div className="mt-2 text-xs text-gray-600 italic">
                    "{item.caption}"
                  </div>
                )}
              </>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="text-sm text-purple-600">
            <span className="font-medium">Video YouTube</span>
            {item.videoUrl && getYouTubeVideoId(item.videoUrl) && (
              <div className="mt-2">
                <iframe
                  className="w-full max-w-md aspect-video rounded"
                  src={getYouTubeEmbedUrl(item.videoUrl)}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {item.caption && (
                  <div className="mt-1 text-xs text-gray-600 italic">
                    "{item.caption}"
                  </div>
                )}
              </div>
            )}
            {item.videoUrl && !getYouTubeVideoId(item.videoUrl) && (
              <div className="mt-2 text-amber-600">
                ⚠️ URL YouTube không hợp lệ
              </div>
            )}
            {!item.videoUrl && (
              <div className="mt-2 text-gray-400">Chưa có URL video</div>
            )}
          </div>
        );
      default:
        return <p className="text-gray-400">Không xác định</p>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Nội dung giới thiệu</h4>
      </div>

      <div className="space-y-3">
        {value.map((item, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Mục {index + 1}: {
                    item.type === 'title' ? 'Tiêu đề' :
                    item.type === 'description' ? 'Mô tả' :
                    item.type === 'image' ? 'Hình ảnh' :
                    item.type === 'images' ? 'Nhiều hình ảnh' :
                    item.type === 'video' ? 'Video' : 'Không xác định'
                  }
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === value.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  >
                    {editingIndex === index ? 'Xong' : 'Sửa'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingIndex === index ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Loại</label>
                    <Select
                      value={item.type}
                      onValueChange={(type: 'title' | 'description' | 'image' | 'images' | 'video') => {
                        const updates: Partial<BlogIntroductionItem> = { type };

                        // Initialize appropriate fields based on type
                        if (type === 'images') {
                          updates.images = item.images || [];
                          // Clear other type fields
                          updates.text = undefined;
                          updates.imageUrl = undefined;
                          updates.public_id = undefined;
                          updates.videoUrl = undefined;
                        } else if (type === 'image') {
                          updates.imageUrl = item.imageUrl || '';
                          updates.public_id = item.public_id || '';
                          // Clear other type fields
                          updates.text = undefined;
                          updates.images = undefined;
                          updates.videoUrl = undefined;
                        } else if (type === 'video') {
                          updates.videoUrl = item.videoUrl || '';
                          // Clear other type fields
                          updates.text = undefined;
                          updates.imageUrl = undefined;
                          updates.public_id = undefined;
                          updates.images = undefined;
                        } else {
                          // title or description
                          updates.text = item.text || '';
                          // Clear other type fields
                          updates.imageUrl = undefined;
                          updates.public_id = undefined;
                          updates.images = undefined;
                          updates.videoUrl = undefined;
                        }

                        updateItem(index, updates);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">Tiêu đề</SelectItem>
                        <SelectItem value="description">Mô tả</SelectItem>
                        <SelectItem value="image">Hình ảnh</SelectItem>
                        <SelectItem value="images">Nhiều hình ảnh</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {item.type !== 'image' && item.type !== 'images' && item.type !== 'video' && (
                    <div>
                      <label className="text-sm font-medium">Nội dung</label>
                      {item.type === 'description' ? (
                        <ReactQuill
                          theme="snow"
                          value={item.text || ''}
                          onChange={(value) => updateItem(index, { text: value })}
                          placeholder="Nhập mô tả..."
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              [{ 'color': [] }, { 'background': [] }],
                              ['link'],
                              ['clean']
                            ],
                          }}
                          formats={[
                            'header', 'bold', 'italic', 'underline', 'strike',
                            'list', 'bullet', 'color', 'background', 'link'
                          ]}
                        />
                      ) : (
                        <Input
                          value={item.text || ''}
                          onChange={(e) => updateItem(index, { text: e.target.value })}
                          placeholder="Nhập tiêu đề..."
                        />
                      )}
                    </div>
                  )}

                  {item.type === 'image' && (
                    <div>
                      <label className="text-sm font-medium">Chọn hình ảnh</label>
                      <ImageUpload
                        value={item.imageUrl || ''}
                        onChange={(value) => {
                          if (typeof value === 'string') {
                            updateItem(index, { imageUrl: value });
                          } else {
                            updateItem(index, {
                              imageUrl: value.url,
                              public_id: value.public_id
                            });
                          }
                        }}
                        onRemove={async (data) => {
                          try {
                            if (typeof data === 'string') {
                              await uploadService.deleteFile(data);
                            } else {
                              await uploadService.deleteFile(data.public_id, 'image');
                            }
                          } catch (error) {
                            logger.error('Failed to delete file:', error);
                          }
                        }}
                        placeholder="Chọn hoặc kéo thả hình ảnh"
                        maxSizeInMB={10}
                        previewSize="medium"
                        folder="description_blog"
                        useObjectFormat={true}
                      />
                      <div className="mt-3">
                        <label className="text-sm font-medium">Chú thích (tùy chọn)</label>
                        <Input
                          value={item.caption || ''}
                          onChange={(e) => updateItem(index, { caption: e.target.value })}
                          placeholder="Nhập chú thích cho hình ảnh..."
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Chú thích sẽ hiển thị bên dưới hình ảnh để người xem dễ hiểu hơn.
                        </p>
                      </div>
                    </div>
                  )}

                  {item.type === 'images' && (
                    <div>
                      <label className="text-sm font-medium">Chọn nhiều hình ảnh</label>
                      <MultipleImageUpload
                        value={item.images || []}
                        onChange={(images) => updateItem(index, { images })}
                        placeholder="Chọn hoặc kéo thả nhiều hình ảnh"
                        maxSizeInMB={10}
                        maxImages={10}
                        folder="description_blog"
                      />
                      <div className="mt-3">
                        <label className="text-sm font-medium">Chú thích (tùy chọn)</label>
                        <Input
                          value={item.caption || ''}
                          onChange={(e) => updateItem(index, { caption: e.target.value })}
                          placeholder="Nhập chú thích cho bộ hình ảnh..."
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Chú thích sẽ hiển thị bên dưới bộ hình ảnh để người xem dễ hiểu hơn.
                        </p>
                      </div>
                    </div>
                  )}

                  {item.type === 'video' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">URL Video YouTube hoặc Iframe Embed *</label>
                        <Input
                          value={item.videoUrl || ''}
                          onChange={(e) => {
                            const input = e.target.value;
                            // If user pastes iframe, extract and save clean embed URL
                            if (input.includes('<iframe')) {
                              const videoId = getYouTubeVideoId(input);
                              if (videoId) {
                                updateItem(index, { videoUrl: `https://www.youtube.com/embed/${videoId}` });
                                return;
                              }
                            }
                            // Otherwise save as-is
                            updateItem(index, { videoUrl: input });
                          }}
                          placeholder="Paste URL hoặc iframe embed từ YouTube..."
                          className={item.videoUrl && !getYouTubeVideoId(item.videoUrl) ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Hỗ trợ: URL YouTube, iframe embed code, hoặc link rút gọn youtu.be
                        </p>
                      </div>

                      {/* Invalid URL Warning - Show immediately when URL is invalid */}
                      {item.videoUrl && item.videoUrl.trim() !== '' && !getYouTubeVideoId(item.videoUrl) && (
                        <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                            <span className="text-lg">❌</span>
                            URL hoặc iframe không hợp lệ!
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Vui lòng paste một trong các định dạng sau:
                          </p>
                          <ul className="text-xs text-red-600 mt-1 ml-4 list-disc space-y-1">
                            <li>URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ</li>
                            <li>Link rút gọn: https://youtu.be/dQw4w9WgXcQ</li>
                            <li>Iframe: &lt;iframe src="https://www.youtube.com/embed/..."&gt;&lt;/iframe&gt;</li>
                          </ul>
                        </div>
                      )}

                      {/* YouTube Preview - Only show when URL is valid */}
                      {item.videoUrl && getYouTubeVideoId(item.videoUrl) && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">✅</span>
                            <label className="text-sm font-medium text-green-700">URL hợp lệ - Preview:</label>
                          </div>
                          <div className="border-2 border-green-300 rounded-lg overflow-hidden">
                            <iframe
                              className="w-full h-64"
                              src={getYouTubeEmbedUrl(item.videoUrl)}
                              title="YouTube video preview"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}

                      {/* Caption input */}
                      <div>
                        <label className="text-sm font-medium">Chú thích (tùy chọn)</label>
                        <Input
                          value={item.caption || ''}
                          onChange={(e) => updateItem(index, { caption: e.target.value })}
                          placeholder="Nhập chú thích cho video..."
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Chú thích sẽ hiển thị bên dưới video để người xem dễ hiểu hơn.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted/50 p-3 rounded">
                  {renderPreview(item, index)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Item Button - Always at the bottom */}
      <Button type="button" onClick={addItem} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Thêm mục
      </Button>

      {value.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>Chưa có mục nào. Nhấn nút "Thêm mục" bên dưới để bắt đầu.</p>
        </div>
      )}
    </div>
  );
}
