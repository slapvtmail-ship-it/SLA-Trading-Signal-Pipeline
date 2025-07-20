
import React from 'react';
import { SectionCard } from './SectionCard';
import { CloudIcon } from './icons/CloudIcon';
import { GCPubSubIcon } from './icons/GCPubSubIcon';
import { GCCloudRunIcon } from './icons/GCCloudRunIcon';
import { GCFirestoreIcon } from './icons/GCFirestoreIcon';
import { GCSecretManagerIcon } from './icons/GCSecretManagerIcon';

const Service: React.FC<{ icon: React.ReactNode, name: string }> = ({ icon, name }) => (
    <div className="flex items-center space-x-3 bg-slate-900 p-3 rounded-md">
        <div className="text-blue-400">{icon}</div>
        <span className="text-sm font-medium text-slate-300">{name}</span>
    </div>
);

export const ArchitecturePanel: React.FC = () => {
  return (
    <SectionCard title="Cloud Backbone" icon={<CloudIcon />}>
      <div className="space-y-3">
        <Service icon={<GCPubSubIcon />} name="Pub/Sub (Data Bus)" />
        <Service icon={<GCCloudRunIcon />} name="Cloud Run (Microservices)" />
        <Service icon={<GCFirestoreIcon />} name="Firestore (Trade Logs)" />
        <Service icon={<GCSecretManagerIcon />} name="Secret Manager (API Keys)" />
      </div>
    </SectionCard>
  );
};
