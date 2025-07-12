import React from 'react';
import ProductDetailResponsive from './ProductDetailResponsive';
import ProductDetailInfo from './ProductDetailInfo';
import RelatedProducts from './RelatedProducts';

const ProductDetailComplete = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Sub-navigation và Product Featured */}
      <ProductDetailResponsive />
      
      {/* Product Detail Information */}
      <ProductDetailInfo />
      
      {/* Related Products */}
      <RelatedProducts />
    </div>
  );
};

export default ProductDetailComplete;
