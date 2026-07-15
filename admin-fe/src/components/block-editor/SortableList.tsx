import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

const STRATEGIES = {
  list: verticalListSortingStrategy,
  grid: rectSortingStrategy,
};

export function useDragSensors(distance = 5) {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}

interface SortableRowProps {
  id: string;
  disabled?: boolean;
  children: (props: {
    setNodeRef: (node: HTMLElement | null) => void;
    style: React.CSSProperties;
    attributes: any;
    listeners: any;
    isDragging: boolean;
    handleProps: any;
  }) => React.ReactNode;
}

export function SortableRow({ id, disabled = false, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <>
      {children({
        setNodeRef,
        style,
        attributes,
        listeners,
        isDragging,
        handleProps: { ...attributes, ...listeners },
      })}
    </>
  );
}

interface DragHandleProps {
  handleProps: any;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function DragHandle({
  handleProps,
  label,
  disabled = false,
  className,
}: DragHandleProps) {
  return (
    <button
      type="button"
      {...(disabled ? {} : handleProps)}
      disabled={disabled}
      className={`flex h-9 w-7 shrink-0 items-center justify-center rounded-sm text-slate-400 ${
        disabled
          ? "opacity-40"
          : "cursor-grab touch-none hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
      } ${className || ""}`}
      title={label}
      aria-label={label}
    >
      <GripVertical size={16} aria-hidden="true" />
    </button>
  );
}

interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (nextItems: T[]) => void;
  disabled?: boolean;
  renderItem: (item: T, sortable: any, index: number) => React.ReactNode;
  renderOverlay?: (item: T) => React.ReactNode;
  layout?: "list" | "grid";
  as?: React.ElementType;
  className?: string;
  footer?: React.ReactNode;
  sensorDistance?: number;
  t: (key: string) => string;
}

export function SortableList<T>({
  items,
  getId,
  onReorder,
  disabled = false,
  renderItem,
  renderOverlay,
  layout = "list",
  as: Wrapper = "div",
  className,
  footer = null,
  sensorDistance = 5,
  t,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useDragSensors(sensorDistance);
  const ids = items.map(getId);
  const strategy = STRATEGIES[layout] ?? verticalListSortingStrategy;

  function handleDragStart(event: DragStartEvent) {
    if (disabled) return;
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  const activeItem =
    activeId != null ? items.find((it) => getId(it) === activeId) : null;

  const accessibility = {
    screenReaderInstructions: {
      draggable: t(
        "Kéo để sắp xếp. Nhấn phím cách để bắt đầu kéo. Khi đang kéo, dùng phím mũi tên để di chuyển. Nhấn phím cách để thả, hoặc Escape để hủy.",
      ),
    },
    announcements: {
      onDragStart: () => t("Đã nhấc phần tử, bắt đầu sắp xếp."),
      onDragOver: () => t("Phần tử đang được di chuyển."),
      onDragEnd: () => t("Đã thả phần tử vào vị trí mới."),
      onDragCancel: () => t("Đã hủy kéo, phần tử trở về vị trí cũ."),
    },
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={accessibility}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={ids} strategy={strategy}>
        <Wrapper className={className}>
          {items.map((item, index) => (
            <SortableRow key={getId(item)} id={getId(item)} disabled={disabled}>
              {(sortable) => renderItem(item, sortable, index)}
            </SortableRow>
          ))}
          {footer}
        </Wrapper>
      </SortableContext>
      {renderOverlay ? (
        <DragOverlay>
          {activeItem ? renderOverlay(activeItem) : null}
        </DragOverlay>
      ) : null}
    </DndContext>
  );
}
