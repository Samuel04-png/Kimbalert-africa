import React from 'react';
import { useParams } from 'react-router-dom';
import AlertStatusShared from './AlertStatusShared';

export default function AlertStatusDetailPage() {
  const { id } = useParams();
  return <AlertStatusShared reportId={id} />;
}


