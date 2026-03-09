// Test script to verify API call URL
const blogId = '2';
const limit = 4;
const fields = 'id,title,description,image,category,createdAt';

const API_BASE_URL = 'https://api.4thitek.vn/api';
const fieldsParam = fields ? `&fields=${fields}` : '';
const url = `${API_BASE_URL}/blog/blogs/related/${blogId}?limit=${limit}${fieldsParam}`;

console.log('=== API Call Test ===');
console.log('Blog ID:', blogId);
console.log('Limit:', limit);
console.log('Fields (raw):', fields);
console.log('\nConstructed URL (before axios encoding):');
console.log(url);
console.log('\nExpected URL (after axios auto-encoding):');
console.log(url.replace(/,/g, '%2C'));
console.log('\n✅ This should match:', 'https://api.4thitek.vn/api/blog/blogs/related/2?limit=4&fields=id%2Ctitle%2Cdescription%2Cimage%2Ccategory%2CcreatedAt');
