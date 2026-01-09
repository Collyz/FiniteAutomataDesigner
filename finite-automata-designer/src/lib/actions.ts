'use server'

import {createClient} from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Provider } from '@supabase/supabase-js';

const signInWith = (provider : Provider) => async () => {
    const supabase = await createClient()

    const auth_callback_url = `${process.env.SITE_URL}/auth/callback`

    const {data, error} =

    await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: auth_callback_url
        },
    })

    console.log(data);

    if(error){
        console.log(error);
    }
    redirect(data.url ? data.url : "null")
}   

const signinWithGoogle = signInWith('google');

const sendResetPasswordEmail = async (
    prev: {error: string; success: string},
    formData: FormData) => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.resetPasswordForEmail(
        formData.get('email') as string,
    );

    if (error) {
        console.log(error);

        return {
            success: '',
            error: error.message,
        };
    }
    
    return {
        success: 'Please check your email',
        error: '',
    }
}

const updatePassword = async (
    prev: {error: string; success: string},
    formData: FormData) => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.updateUser({
        password: formData.get('password') as string,
    });



    if (error) {
        console.log(error);

        return {
            success: '',
            error: error.message,
        };
    }

    await supabase.auth.signOut();
    
    // Revalidate the layout to ensure Navbar updates
    revalidatePath('/', 'layout');

    return {
        success: 'Password updated successfully',
        error: '',
    }
}

export { signinWithGoogle, sendResetPasswordEmail, updatePassword };