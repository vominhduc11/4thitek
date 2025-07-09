# Layout Alignment Fixes

## Problem
ProductSeries và các components khác có padding không đều 2 bên, gây mất cân đối trong layout.

## Before
```css
/* ProductSeries - Không đều */
pl-4 sm:pl-6 md:pl-24  /* Left: 16px → 24px → 96px */
pr-3 sm:pr-5           /* Right: 12px → 20px */

/* ProductFeature - Không đều */
pl-4 sm:pl-6 md:pl-24  /* Left: 16px → 24px → 96px */
pr-4 sm:pr-6           /* Right: 16px → 24px */
```

## After - Container Approach
```css
/* Tất cả components giờ sử dụng container approach */
<section className="py-12 sm:py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Content -->
  </div>
</section>
```

## Components Updated

### 1. ProductSeries
- ✅ **Before:** `pl-4 sm:pl-6 md:pl-24 pr-3 sm:pr-5`
- ✅ **After:** Container với `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

### 2. ProductFeature  
- ✅ **Before:** `pl-4 sm:pl-6 md:pl-24 pr-4 sm:pr-6`
- ✅ **After:** Container với `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

### 3. Newsroom
- ✅ **Before:** `px-4 sm:px-6 md:px-24` (đã đều nhưng cải thiện consistency)
- ✅ **After:** Container với `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

### 4. FeatureCards
- ✅ **Before:** `px-4 sm:px-6 lg:px-8` (đã tốt)
- ✅ **After:** Cải thiện structure với container approach

## Benefits

### 1. **Consistent Spacing**
- Tất cả sections giờ có padding đều 2 bên
- Responsive breakpoints consistent: `px-4 sm:px-6 lg:px-8`

### 2. **Better Centering**
- Content được căn giữa với `max-w-7xl mx-auto`
- Tự động responsive trên tất cả screen sizes

### 3. **Maintainable Code**
- Cùng pattern cho tất cả components
- Dễ dàng thay đổi spacing globally

### 4. **Professional Layout**
- Content không bị dính sát edges
- Proper breathing room trên large screens
- Consistent visual hierarchy

## Responsive Behavior

```css
/* Mobile */
px-4     /* 16px both sides */

/* Small tablets */
sm:px-6  /* 24px both sides */

/* Large screens */
lg:px-8  /* 32px both sides */

/* Max width container */
max-w-7xl  /* 1280px max, then centered */
```

## Visual Result
- ✅ All sections now have equal padding left/right
- ✅ Content properly centered on all screen sizes  
- ✅ Consistent spacing throughout the page
- ✅ Professional, balanced layout
- ✅ No more awkward asymmetrical spacing
