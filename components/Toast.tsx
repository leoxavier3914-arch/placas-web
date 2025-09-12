'use client';

import { Toaster, toast } from 'react-hot-toast';

export default function Toast() {
  return <Toaster position="top-right" />;
}

export { toast };
