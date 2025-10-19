import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Truck, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

const PaymentForm = ({ 
  paymentData, 
  onSuccess, 
  onCancel, 
  isLoading: parentLoading = false 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      paymentMethod: 'credit_card',
      provider: 'stripe',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardName: '',
      phoneNumber: '',
      bankName: '',
      accountNumber: ''
    }
  });

  const processPaymentMutation = useMutation(paymentsAPI.processPayment, {
    onSuccess: (data) => {
      toast.success('Payment processed successfully!');
      onSuccess(data);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Payment processing failed');
    }
  });

  const onSubmit = async (data) => {
    setIsProcessing(true);
    
    try {
      const paymentMethod = {
        type: selectedMethod,
        provider: data.provider,
        details: getPaymentDetails(data, selectedMethod)
      };

      await processPaymentMutation.mutateAsync({
        paymentId: paymentData.paymentId,
        paymentMethod
      });
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentDetails = (data, method) => {
    switch (method) {
      case 'credit_card':
        return {
          cardLast4: data.cardNumber.slice(-4),
          cardBrand: getCardBrand(data.cardNumber),
          expiryMonth: data.expiryDate.split('/')[0],
          expiryYear: data.expiryDate.split('/')[1]
        };
      case 'mobile_wallet':
        return {
          walletType: data.provider,
          phoneNumber: data.phoneNumber
        };
      case 'bank_transfer':
        return {
          bankName: data.bankName,
          accountNumber: data.accountNumber
        };
      case 'cash_on_delivery':
        return {
          deliveryAddress: paymentData.billingAddress
        };
      default:
        return {};
    }
  };

  const getCardBrand = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    return 'unknown';
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value) => {
    return value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
  };

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express',
      available: true
    },
    {
      id: 'mobile_wallet',
      name: 'Mobile Wallet',
      icon: Smartphone,
      description: 'Dialog, Mobitel, Hutch',
      available: true
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Direct bank transfer',
      available: true
    },
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      icon: Truck,
      description: 'Pay when you receive tickets',
      available: true
    }
  ];

  const mobileWalletProviders = [
    { value: 'dialog', label: 'Dialog' },
    { value: 'mobitel', label: 'Mobitel' },
    { value: 'hutch', label: 'Hutch' }
  ];

  const banks = [
    { value: 'commercial', label: 'Commercial Bank' },
    { value: 'peoples', label: 'People\'s Bank' },
    { value: 'sampath', label: 'Sampath Bank' },
    { value: 'hatton', label: 'Hatton National Bank' },
    { value: 'ndb', label: 'NDB Bank' }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Secure Payment
          </h3>
          <p className="text-gray-600 mt-1">
            Your payment information is encrypted and secure
          </p>
        </div>

        <div className="card-body">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Event:</span>
                <span className="font-medium">{paymentData.event?.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-lg text-green-600">
                  LKR {paymentData.amount?.total?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Currency:</span>
                <span className="font-medium">{paymentData.amount?.currency}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Choose Payment Method</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => method.available && setSelectedMethod(method.id)}
                >
                  <div className="flex items-center space-x-3">
                    <method.icon className="w-6 h-6 text-gray-600" />
                    <div>
                      <h5 className="font-medium text-gray-900">{method.name}</h5>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Credit Card Form */}
            {selectedMethod === 'credit_card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number *
                  </label>
                  <input
                    {...register('cardNumber', {
                      required: 'Card number is required',
                      pattern: {
                        value: /^[0-9\s]{13,19}$/,
                        message: 'Invalid card number'
                      }
                    })}
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="input-field"
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      setValue('cardNumber', formatted);
                    }}
                  />
                  {errors.cardNumber && (
                    <p className="form-error">{errors.cardNumber.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      {...register('expiryDate', {
                        required: 'Expiry date is required',
                        pattern: {
                          value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                          message: 'Invalid expiry date (MM/YY)'
                        }
                      })}
                      type="text"
                      placeholder="MM/YY"
                      className="input-field"
                      maxLength={5}
                      onChange={(e) => {
                        const formatted = formatExpiryDate(e.target.value);
                        setValue('expiryDate', formatted);
                      }}
                    />
                    {errors.expiryDate && (
                      <p className="form-error">{errors.expiryDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV *
                    </label>
                    <input
                      {...register('cvv', {
                        required: 'CVV is required',
                        pattern: {
                          value: /^[0-9]{3,4}$/,
                          message: 'Invalid CVV'
                        }
                      })}
                      type="text"
                      placeholder="123"
                      className="input-field"
                      maxLength={4}
                    />
                    {errors.cvv && (
                      <p className="form-error">{errors.cvv.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name *
                  </label>
                  <input
                    {...register('cardName', {
                      required: 'Cardholder name is required'
                    })}
                    type="text"
                    placeholder="John Doe"
                    className="input-field"
                  />
                  {errors.cardName && (
                    <p className="form-error">{errors.cardName.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Wallet Form */}
            {selectedMethod === 'mobile_wallet' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallet Provider *
                  </label>
                  <select
                    {...register('provider', {
                      required: 'Wallet provider is required'
                    })}
                    className="input-field"
                  >
                    <option value="">Select wallet provider</option>
                    {mobileWalletProviders.map(provider => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                  {errors.provider && (
                    <p className="form-error">{errors.provider.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    {...register('phoneNumber', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Invalid phone number'
                      }
                    })}
                    type="tel"
                    placeholder="0712345678"
                    className="input-field"
                  />
                  {errors.phoneNumber && (
                    <p className="form-error">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Bank Transfer Form */}
            {selectedMethod === 'bank_transfer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank *
                  </label>
                  <select
                    {...register('bankName', {
                      required: 'Bank is required'
                    })}
                    className="input-field"
                  >
                    <option value="">Select bank</option>
                    {banks.map(bank => (
                      <option key={bank.value} value={bank.value}>
                        {bank.label}
                      </option>
                    ))}
                  </select>
                  {errors.bankName && (
                    <p className="form-error">{errors.bankName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    {...register('accountNumber', {
                      required: 'Account number is required'
                    })}
                    type="text"
                    placeholder="Enter account number"
                    className="input-field"
                  />
                  {errors.accountNumber && (
                    <p className="form-error">{errors.accountNumber.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Cash on Delivery Info */}
            {selectedMethod === 'cash_on_delivery' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Truck className="w-5 h-5 text-yellow-600 mr-2" />
                  <h4 className="font-medium text-yellow-800">Cash on Delivery</h4>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  You will pay when you receive your tickets. A small delivery fee may apply.
                </p>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="font-medium text-green-800">Secure Payment</h4>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your payment information is encrypted and processed securely. We never store your card details.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 btn-secondary"
                disabled={isProcessing || parentLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || parentLoading}
                className="flex-1 btn-primary flex items-center justify-center"
              >
                {isProcessing || parentLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Pay LKR {paymentData.amount?.total?.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
