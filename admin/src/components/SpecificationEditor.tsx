import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { ProductSpecifications, SpecificationItem } from "@/types";

interface SpecificationEditorProps {
  value: ProductSpecifications;
  onChange: (specs: ProductSpecifications) => void;
}

export function SpecificationEditor({ value, onChange }: SpecificationEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addItem = () => {
    const newItem: SpecificationItem = {
      label: '',
      value: ''
    };
    const currentSpecs = Array.isArray(value) ? value : [];
    const updatedSpecs = [...currentSpecs, newItem];
    onChange(updatedSpecs);
    setEditingIndex(currentSpecs.length);
  };

  const removeItem = (index: number) => {
    const currentSpecs = Array.isArray(value) ? value : [];
    const updatedSpecs = currentSpecs.filter((_, i) => i !== index);
    onChange(updatedSpecs);
    setEditingIndex(null);
  };

  const updateItem = (index: number, updates: Partial<SpecificationItem>) => {
    const currentSpecs = Array.isArray(value) ? value : [];
    const updatedSpecs = currentSpecs.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    onChange(updatedSpecs);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const currentSpecs = Array.isArray(value) ? value : [];
    const items = [...currentSpecs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < items.length) {
      [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
      onChange(items);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Thông số kỹ thuật</h4>
      </div>

      <div className="space-y-2">
        {Array.isArray(value) && value.map((item, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {item.label || `Thông số ${index + 1}`}
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
                    disabled={index === (Array.isArray(value) ? value.length : 0) - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const isEditing = editingIndex === index;
                      setEditingIndex(isEditing ? null : index);
                    }}
                  >
                    {editingIndex === index ? 'Xong' : 'Sửa'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-destructive hover:text-destructive/80"
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
                    <label className="text-sm font-medium">Tên thông số</label>
                    <Input
                      value={item.label}
                      onChange={(e) => updateItem(index, { label: e.target.value })}
                      placeholder="Ví dụ: Kích thước, Trọng lượng..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Giá trị</label>
                    <Input
                      value={item.value}
                      onChange={(e) => updateItem(index, { value: e.target.value })}
                      placeholder="Ví dụ: 15.6 inch, 2.5kg..."
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 p-3 rounded">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{item.label || 'Chưa có tên'}:</span>{' '}
                    <span className="text-muted-foreground">{item.value || 'Chưa có giá trị'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Item Button - Always at the bottom */}
      <Button
        type="button"
        onClick={addItem}
        variant="outline"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Thêm thông số
      </Button>

      {(!Array.isArray(value) || value.length === 0) && (
        <div className="text-center py-4 text-muted-foreground">
          <p>Chưa có thông số nào. Nhấn nút "Thêm thông số" bên dưới để bắt đầu.</p>
        </div>
      )}
    </div>
  );
}