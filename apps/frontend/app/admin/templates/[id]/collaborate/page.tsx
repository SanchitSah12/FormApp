'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CollaborativeTemplateEditor } from '@/components/collaboration/CollaborativeTemplateEditor';

export default function CollaborativeTemplatePage() {
    const params = useParams();
    const templateId = params.id as string;

    return (
        <ProtectedRoute requireAdmin>
            <div className="container mx-auto py-6">
                <CollaborativeTemplateEditor templateId={templateId} />
            </div>
        </ProtectedRoute>
    );
} 