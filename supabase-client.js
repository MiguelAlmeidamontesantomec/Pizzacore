// Configurações do seu projeto Supabase
const SUPABASE_URL = 'https://lwdgamxwwgurknaoqset.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZGdhbXh3d2d1cmtuYW9xc2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDE2NTEsImV4cCI6MjA4NDI3NzY1MX0.th70GFLc6MRNI-oBvphoi2dkOCqqfCY1ER4LHSFsjsY'; // Mantenha sua chave real aqui

// Inicializa o cliente com um nome único para evitar erros de 'undefined'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Função para proteger páginas privadas.
 * Se o usuário não estiver logado, ele é expulso para a página de login.
 */
async function checkAuth() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    // Se houver erro ou não houver usuário logado
    if (error || !user) {
        // Só redireciona se não estivermos na página de login ou cadastro
        const path = window.location.pathname;
        if (!path.includes('login.html') && !path.includes('signup.html')) {
            window.location.href = 'login.html';
        }
    }
    return user;
}