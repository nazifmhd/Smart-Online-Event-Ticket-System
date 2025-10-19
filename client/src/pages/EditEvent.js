import React from 'react';
import { Edit } from 'lucide-react';

const EditEvent = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-600">
          Update your event details
        </p>
      </div>

      <div className="text-center py-12">
        <Edit className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Editing Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          The event editing functionality is being developed. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default EditEvent;
