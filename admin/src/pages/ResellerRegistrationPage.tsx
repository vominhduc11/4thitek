import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, UserPlus, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { registerReseller, DealerRegistrationRequest } from '@/services/resellerService';

const ResellerRegistrationPage = () => {
  const [formData, setFormData] = useState<DealerRegistrationRequest>({
    companyName: '',
    fullName: '',
    taxCode: '',
    email: '',
    phone: '',
    address: '',
    district: '',
    city: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Vui lòng nhập tên công ty/doanh nghiệp';
    }
    
    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên người liên hệ';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }
    
    if (!formData.district.trim()) {
      newErrors.district = 'Vui lòng nhập quận/huyện';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'Vui lòng nhập thành phố';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof DealerRegistrationRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerReseller(formData);
      
      if (response.success) {
        setSuccess(true);
      } else {
        setErrorMessage(response.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      setErrorMessage('Lỗi kết nối đến server. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Đăng ký thành công!</CardTitle>
            <CardDescription>
              Tài khoản đại lý của bạn đã được tạo thành công
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Quay lại trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Đăng ký Đại lý</CardTitle>
          <CardDescription>
            Điền thông tin doanh nghiệp để trở thành đại lý của chúng tôi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Tên công ty/doanh nghiệp *</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="vd: Công ty TNHH ABC"
                  value={formData.companyName}
                  onChange={handleInputChange('companyName')}
                  disabled={isLoading}
                  className={errors.companyName ? 'border-red-500' : ''}
                />
                {errors.companyName && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.companyName}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên người liên hệ *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={formData.fullName}
                  onChange={handleInputChange('fullName')}
                  disabled={isLoading}
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.fullName}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxCode">Mã số thuế</Label>
                <Input
                  id="taxCode"
                  type="text"
                  placeholder="Tuỳ chọn"
                  value={formData.taxCode}
                  onChange={handleInputChange('taxCode')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={isLoading}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  disabled={isLoading}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ *</Label>
              <Input
                id="address"
                type="text"
                placeholder="Nhập địa chỉ"
                value={formData.address}
                onChange={handleInputChange('address')}
                disabled={isLoading}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.address}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">Quận/Huyện *</Label>
                <Input
                  id="district"
                  type="text"
                  placeholder="Nhập quận/huyện"
                  value={formData.district}
                  onChange={handleInputChange('district')}
                  disabled={isLoading}
                  className={errors.district ? 'border-red-500' : ''}
                />
                {errors.district && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.district}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Thành phố *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Nhập thành phố"
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  disabled={isLoading}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.city}
                  </div>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errorMessage}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký Đại lý'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResellerRegistrationPage;
