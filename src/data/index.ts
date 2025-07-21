// Export all data modules
export * from './products';
export * from './blogs';
export * from './certifications';
export * from './warranty';
export * from './contact';
export * from './resellers';

// Re-export commonly used data
export {
    products,
    productCategories,
    getProductById,
    getProductsByCategory,
    getRelatedProducts,
    searchProducts,
    getPopularProducts,
    getAvailableCategories,
    getAvailableFeatures,
    getAvailableTargetAudience
} from './products';

export {
    blogPosts,
    blogCategories,
    blogAuthors,
    blogTags,
    getPostsByCategory,
    getPostsByTag,
    getFeaturedPosts,
    getPublishedPosts
} from './blogs';

export {
    certificationStandards,
    certificationCategories,
    productCertifications,
    testingLaboratories,
    complianceRequirements,
    getCertificationsByProductId,
    getCertificationsByCategory,
    getCertificationById,
    getStandardById,
    getActiveCertifications,
    getCertificationsByImportance,
    getComplianceByRegion,
    searchCertifications
} from './certifications';

export {
    warrantyTerms,
    warrantyPlans,
    serviceCenters,
    warrantyProcesses,
    warrantyFAQs,
    warrantyPolicy,
    getWarrantyPlanById,
    getServiceCenterById,
    getServiceCentersByCity,
    getFAQsByCategory,
    searchFAQs,
    getPopularFAQs
} from './warranty';

export {
    contactInfo,
    socialMedia,
    officeLocations,
    departments,
    businessHours,
    emergencyContacts,
    getContactByType,
    getPrimaryContacts,
    getOfficeById,
    getMainOffice,
    getDepartmentById,
    getActiveSocialMedia,
    getVerifiedSocialMedia
} from './contact';

export {
    resellerTiers,
    resellerLocations,
    resellerRequirements,
    resellerBenefits,
    resellerSupport,
    getTierById,
    getLocationsByTier,
    getActiveLocations
} from './resellers';
