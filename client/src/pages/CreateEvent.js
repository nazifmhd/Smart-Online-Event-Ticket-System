import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, MapPin, DollarSign, Users, Upload, Save, X } from 'lucide-react';

const CreateEvent = () => {
  const [pricingCategories, setPricingCategories] = useState([
    { name: 'Normal', price: 1000, totalTickets: 100, description: 'General admission' }
  ]);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'concert',
      eventType: 'paid',
      startDate: '',
      endDate: '',
      startTime: '19:00',
      endTime: '21:00',
      venue: '',
      street: '',
      city: 'Colombo',
      state: 'Western Province',
      zipCode: '',
      hasSeating: false,
      hasParking: false,
      hasFood: false,
      isAccessible: false
    }
  });

  const createEventMutation = useMutation(eventsAPI.createEvent, {
    onSuccess: (data) => {
      toast.success('Event created successfully!');
      queryClient.invalidateQueries('events');
      navigate('/my-events');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create event');
    }
  });

  const addPricingCategory = () => {
    setPricingCategories([...pricingCategories, {
      name: '',
      price: 0,
      totalTickets: 0,
      description: ''
    }]);
  };

  const updatePricingCategory = (index, field, value) => {
    const updated = [...pricingCategories];
    updated[index][field] = value;
    setPricingCategories(updated);
  };

  const removePricingCategory = (index) => {
    if (pricingCategories.length > 1) {
      setPricingCategories(pricingCategories.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const eventData = {
        ...data,
        date: {
          startDate: new Date(`${data.startDate}T${data.startTime}`).toISOString(),
          endDate: new Date(`${data.endDate}T${data.endTime}`).toISOString(),
          time: {
            startTime: data.startTime,
            endTime: data.endTime
          }
        },
        location: {
          venue: data.venue,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: 'Sri Lanka'
          }
        },
        pricing: {
          categories: pricingCategories
        },
        features: {
          hasSeating: data.hasSeating,
          hasParking: data.hasParking,
          hasFood: data.hasFood,
          isAccessible: data.isAccessible
        },
        images: images.map(img => ({
          url: img.preview,
          alt: img.name,
          isPrimary: false
        }))
      };

      await createEventMutation.mutateAsync(eventData);
    } catch (error) {
      console.error('Event creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'concert', label: 'Concert' },
    { value: 'sports', label: 'Sports' },
    { value: 'conference', label: 'Conference' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'exhibition', label: 'Exhibition' },
    { value: 'festival', label: 'Festival' },
    { value: 'other', label: 'Other' }
  ];

  const pricingCategoryNames = [
    'Normal', 'VIP', 'Student', 'Early Bird', 'Group', 'Premium', 'Standard'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-600">
          Fill in the details below to create your event
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  {...register('title', { required: 'Event title is required' })}
                  type="text"
                  className="input-field"
                  placeholder="Enter event title"
                />
                {errors.title && (
                  <p className="form-error">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="input-field"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="form-error">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { 
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' }
                })}
                rows={4}
                className="input-field"
                placeholder="Describe your event..."
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    {...register('eventType')}
                    type="radio"
                    value="paid"
                    className="mr-2"
                  />
                  Paid Event
                </label>
                <label className="flex items-center">
                  <input
                    {...register('eventType')}
                    type="radio"
                    value="free"
                    className="mr-2"
                  />
                  Free Event
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Date & Time
            </h3>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  {...register('startDate', { required: 'Start date is required' })}
                  type="date"
                  className="input-field"
                />
                {errors.startDate && (
                  <p className="form-error">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  {...register('endDate', { required: 'End date is required' })}
                  type="date"
                  className="input-field"
                />
                {errors.endDate && (
                  <p className="form-error">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  {...register('startTime', { required: 'Start time is required' })}
                  type="time"
                  className="input-field"
                />
                {errors.startTime && (
                  <p className="form-error">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  {...register('endTime', { required: 'End time is required' })}
                  type="time"
                  className="input-field"
                />
                {errors.endTime && (
                  <p className="form-error">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location
            </h3>
          </div>
          <div className="card-body space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name *
              </label>
              <input
                {...register('venue', { required: 'Venue is required' })}
                type="text"
                className="input-field"
                placeholder="Enter venue name"
              />
              {errors.venue && (
                <p className="form-error">{errors.venue.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                {...register('street')}
                type="text"
                className="input-field"
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  {...register('city', { required: 'City is required' })}
                  type="text"
                  className="input-field"
                  placeholder="Colombo"
                />
                {errors.city && (
                  <p className="form-error">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  {...register('state')}
                  type="text"
                  className="input-field"
                  placeholder="Western Province"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  {...register('zipCode')}
                  type="text"
                  className="input-field"
                  placeholder="10000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Pricing Categories
            </h3>
          </div>
          <div className="card-body space-y-6">
            {pricingCategories.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Category {index + 1}</h4>
                  {pricingCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePricingCategory(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <select
                      value={category.name}
                      onChange={(e) => updatePricingCategory(index, 'name', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select category</option>
                      {pricingCategoryNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (LKR) *
                    </label>
                    <input
                      type="number"
                      value={category.price}
                      onChange={(e) => updatePricingCategory(index, 'price', parseInt(e.target.value) || 0)}
                      className="input-field"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Tickets *
                    </label>
                    <input
                      type="number"
                      value={category.totalTickets}
                      onChange={(e) => updatePricingCategory(index, 'totalTickets', parseInt(e.target.value) || 0)}
                      className="input-field"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={category.description}
                      onChange={(e) => updatePricingCategory(index, 'description', e.target.value)}
                      className="input-field"
                      placeholder="Category description"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPricingCategory}
              className="btn-secondary flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              Add Pricing Category
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Event Features</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  {...register('hasSeating')}
                  type="checkbox"
                  className="mr-2"
                />
                Assigned Seating
              </label>

              <label className="flex items-center">
                <input
                  {...register('hasParking')}
                  type="checkbox"
                  className="mr-2"
                />
                Parking Available
              </label>

              <label className="flex items-center">
                <input
                  {...register('hasFood')}
                  type="checkbox"
                  className="mr-2"
                />
                Food & Beverages
              </label>

              <label className="flex items-center">
                <input
                  {...register('isAccessible')}
                  type="checkbox"
                  className="mr-2"
                />
                Wheelchair Accessible
              </label>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Event Images
            </h3>
          </div>
          <div className="card-body space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-gray-600">Click to upload images</span>
                <span className="text-sm text-gray-500">PNG, JPG up to 10MB each</span>
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/my-events')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center"
          >
            {isSubmitting ? (
              <div className="spinner mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
