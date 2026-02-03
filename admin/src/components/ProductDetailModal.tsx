
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/types";
import { ProductSerialManager } from "./ProductSerialManager";
import { productService } from "@/services/productService";
import { useEffect, useState } from "react";
import DOMPurify from 'dompurify';
import { logger } from '@/utils/logger';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const resolveImageUrl = (image: Product["image"]): string => {
  if (!image) return "/placeholder.svg";
  if (typeof image === "string") {
    try {
      const parsed = JSON.parse(image);
      if (parsed?.imageUrl) return parsed.imageUrl;
      if (parsed?.url) return parsed.url;
    } catch {
      return image;
    }
    return image;
  }
  if (typeof image === "object" && image !== null) {
    // legacy object format with imageUrl/url fields
    // @ts-expect-error allow optional keys
    return image.imageUrl || image.url || "/placeholder.svg";
  }
  return "/placeholder.svg";
};

export function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
  const [inventoryData, setInventoryData] = useState<{
    availableCount: number;
    soldCount: number;
    damagedCount: number;
    totalCount: number;
  } | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    if (product?.id && isOpen) {
      const fetchInventory = async () => {
        setLoadingInventory(true);
        try {
          const response = await productService.getProductInventory(product.id.toString());
          if (response.success) {
            setInventoryData(response.data);
          }
        } catch (error) {
          logger.error('Error fetching inventory:', error);
        } finally {
          setLoadingInventory(false);
        }
      };

      fetchInventory();
    }
  }, [product?.id, isOpen]);

  if (!product) return null;

  const parsedDescriptions = (() => {
    if (!product.descriptions) return { items: [], raw: "" };
    if (Array.isArray(product.descriptions)) return { items: product.descriptions, raw: "" };
    if (typeof product.descriptions === "string") {
      try {
        const parsed = JSON.parse(product.descriptions);
        if (Array.isArray(parsed)) return { items: parsed, raw: "" };
        if (parsed?.descriptions && Array.isArray(parsed.descriptions)) {
          return { items: parsed.descriptions, raw: "" };
        }
      } catch {
        // fall back to raw
      }
      return { items: [], raw: product.descriptions };
    }
    if (typeof product.descriptions === "object" && product.descriptions !== null) {
      // object with nested descriptions array
      // @ts-expect-error legacy API shape with nested descriptions array
      if (product.descriptions.descriptions && Array.isArray(product.descriptions.descriptions)) {
        // @ts-expect-error legacy API shape with nested descriptions array
        return { items: product.descriptions.descriptions, raw: "" };
      }
    }
    return { items: [], raw: "" };
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết sản phẩm</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image and Basic Info */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
          <img
            src={resolveImageUrl(product.image)}
            alt={product.name}
              className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border flex-shrink-0"
            />
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              {product.shortDescription && (
                <p className="text-gray-600 text-sm italic">{product.shortDescription}</p>
              )}
              {product.sku && (
                <div className="flex items-center gap-2">
                  <span>SKU:</span>
                  <Badge variant="outline">{product.sku}</Badge>
                </div>
              )}
              {product.model && (
                <div className="flex items-center gap-2">
                  <span>Mẫu:</span>
                  <Badge variant="outline">{product.model}</Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing and Inventory */}
          <div>
            <h3 className="text-lg font-medium mb-4 dark:text-gray-100">Thông tin giá và kho</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Giá bán</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 break-words">
                  {typeof product.price === 'number'
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
                    : product.price + ' ₫'
                  }
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Tồn kho</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {loadingInventory ? "..." : (inventoryData?.availableCount ?? product.stock ?? 0)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Đã bán</div>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {loadingInventory ? "..." : (inventoryData?.soldCount ?? product.sold ?? 0)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Nổi bật</div>
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {product.isFeatured ? 'Có' : 'Không'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Trang chủ</div>
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {product.showOnHomepage ? 'Có' : 'Không'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {(parsedDescriptions.items.length > 0 || parsedDescriptions.raw) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4 dark:text-gray-100">Mô tả sản phẩm</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg product-description">
                  {parsedDescriptions.items.length > 0 ? (
                    <div className="space-y-4">
                      {parsedDescriptions.items.map((item: any, index: number) => (
                        <div key={index}>
                          {item.type === 'title' && (
                            <h4 className="font-semibold text-lg dark:text-gray-200">{item.text}</h4>
                          )}
                          {item.type === 'description' && (
                            <div className="description-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.text || '') }} />
                          )}
                          {item.type === 'image' && item.imageUrl && (
                            <div>
                              <img
                                src={item.imageUrl}
                                alt="Product description"
                                className="max-w-full rounded"
                              />
                              {item.caption && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center mt-2">
                                  {item.caption}
                                </p>
                              )}
                            </div>
                          )}
                          {item.type === 'images' && item.images && item.images.length > 0 && (
                            <div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {item.images.map((img, imgIndex) => (
                                  <img
                                    key={imgIndex}
                                    src={img.url}
                                    alt={`Image ${imgIndex + 1}`}
                                    className="w-full h-auto rounded object-cover"
                                  />
                                ))}
                              </div>
                              {item.caption && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center mt-2">
                                  {item.caption}
                                </p>
                              )}
                            </div>
                          )}
                          {item.type === 'video' && item.videoUrl && (
                            <div>
                              <div className="relative w-full aspect-video rounded overflow-hidden">
                                <iframe
                                  src={item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be')
                                    ? item.videoUrl.includes('embed')
                                      ? item.videoUrl
                                      : `https://www.youtube.com/embed/${item.videoUrl.split('v=')[1]?.split('&')[0] || item.videoUrl.split('/').pop()}`
                                    : item.videoUrl}
                                  className="w-full h-full"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title="Product video"
                                />
                              </div>
                              {item.caption && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center mt-2">
                                  {item.caption}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parsedDescriptions.raw) }} />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Specifications */}
          {(() => {
            let parsedSpecs = null;
            if (product.specifications) {
              if (typeof product.specifications === 'string') {
                try {
                  parsedSpecs = JSON.parse(product.specifications);
                } catch (e) {
                  logger.error('Error parsing specifications JSON:', e);
                }
              } else if (Array.isArray(product.specifications)) {
                parsedSpecs = product.specifications;
              } else if (typeof product.specifications === 'object') {
                // Handle old format with general/technical groups
                parsedSpecs = product.specifications;
              }
            }

            return parsedSpecs && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4 dark:text-gray-100">Thông số kỹ thuật</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                    {Array.isArray(parsedSpecs) ? (
                      // New format: simple array
                      parsedSpecs.map((spec, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{spec.label}:</span>
                          <span className="font-medium dark:text-gray-200">{spec.value}</span>
                        </div>
                      ))
                    ) : (
                      // Old format: grouped by general/technical
                      <div className="space-y-4">
                        {parsedSpecs.general && parsedSpecs.general.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 dark:text-gray-200">Thông số chung</h4>
                            <div className="space-y-2">
                              {parsedSpecs.general.map((spec, index) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">{spec.label}:</span>
                                  <span className="font-medium dark:text-gray-200">{spec.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {parsedSpecs.technical && parsedSpecs.technical.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 dark:text-gray-200">Thông số kỹ thuật</h4>
                            <div className="space-y-2">
                              {parsedSpecs.technical.map((spec, index) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">{spec.label}:</span>
                                  <span className="font-medium dark:text-gray-200">{spec.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}

          {/* Videos */}
          {(() => {
            let parsedVideos = [];
            if (product.videos) {
              if (typeof product.videos === 'string') {
                try {
                  parsedVideos = JSON.parse(product.videos);
                } catch (e) {
                  logger.error('Error parsing videos JSON:', e);
                }
              } else if (Array.isArray(product.videos)) {
                parsedVideos = product.videos;
              }
            }

            // Helper function to extract YouTube video ID from URL
            const getYouTubeVideoId = (url: string): string | null => {
              if (!url) return null;
              // eslint-disable-next-line no-useless-escape
              const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
              const match = url.match(regex);
              return match ? match[1] : null;
            };

            // Helper function to get YouTube embed URL
            const getYouTubeEmbedUrl = (url: string): string => {
              const videoId = getYouTubeVideoId(url);
              return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
            };

            return parsedVideos && Array.isArray(parsedVideos) && parsedVideos.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4 dark:text-gray-100">
                    {parsedVideos.length === 1 ? 'Video sản phẩm' : 'Videos sản phẩm'}
                  </h3>
                  {parsedVideos.length === 1 ? (
                    /* Single video layout - more prominent display */
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <h5 className="font-medium text-lg mb-2 dark:text-gray-200">{parsedVideos[0].title}</h5>
                          {parsedVideos[0].description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4">{parsedVideos[0].description}</p>
                          )}
                        </div>
                        {parsedVideos[0].videoUrl && getYouTubeVideoId(parsedVideos[0].videoUrl) && (
                          <div className="flex-1">
                            <iframe
                              src={getYouTubeEmbedUrl(parsedVideos[0].videoUrl)}
                              className="w-full h-64 lg:h-80 rounded-lg shadow-sm"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={parsedVideos[0].title}
                            ></iframe>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Multiple videos layout - compact list */
                    <div className="space-y-4">
                      {parsedVideos.map((video, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h5 className="font-medium mb-2 dark:text-gray-200">{video.title}</h5>
                          {video.description && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{video.description}</p>
                          )}
                          {video.videoUrl && getYouTubeVideoId(video.videoUrl) && (
                            <iframe
                              src={getYouTubeEmbedUrl(video.videoUrl)}
                              className="w-full h-64 rounded-lg shadow-sm"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={video.title}
                            ></iframe>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Serial Numbers Management */}
          <Separator />
          <ProductSerialManager 
            productId={product.id!} 
            productName={product.name} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
