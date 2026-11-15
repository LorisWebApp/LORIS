import { supabase } from '../../../services/supabase';
import type { NewSupportRequest, SupportRequest } from '../types/support.types';

function mapRow(row: Record<string, any>): SupportRequest {
  return { id: row.id, reference: row.reference, subject: row.subject, category: row.category,
    description: row.description, status: row.status, createdAt: row.created_at,
    updatedAt: row.updated_at, responses: [] };
}

export const supportService = {
  async list(): Promise<SupportRequest[]> {
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = session.session?.user.id;
    if (!userId) throw new Error('Sign in to view your support requests.');
    const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => mapRow(row as Record<string, any>));
  },
  async create(input: NewSupportRequest): Promise<SupportRequest> {
    const subject = input.subject.trim();
    const description = input.description.trim();
    if (subject.length < 3 || subject.length > 100) throw new Error('The subject must contain between 3 and 100 characters.');
    if (!input.category) throw new Error('Please select a support category.');
    if (description.length < 10 || description.length > 2000) throw new Error('The description must contain between 10 and 2000 characters.');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = session.session?.user.id;
    if (!userId) throw new Error('Sign in to submit a support request.');
    const reference = `SR-${Date.now().toString().slice(-8)}`;
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, reference, subject, category: input.category, description, status: 'open' }).select('*').single();
    if (error) throw error;
    return mapRow(data as Record<string, any>);
  },
};
