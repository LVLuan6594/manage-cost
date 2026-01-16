// Cấu hình tài khoản (có thể thay đổi password ở đây)
const ACCOUNT_CONFIG = {
    username: 'lklinh',
    password: 'lklinh@cusc123'
};

// Lưu cấu hình vào localStorage nếu chưa tồn tại
if (!localStorage.getItem('accountConfig')) {
    localStorage.setItem('accountConfig', JSON.stringify(ACCOUNT_CONFIG));
}

// Hàm kiểm tra đăng nhập
function checkLogin() {
    const loginData = localStorage.getItem('userLogin');
    if (!loginData) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Hàm lấy cấu hình tài khoản hiện tại
function getAccountConfig() {
    const config = localStorage.getItem('accountConfig');
    return config ? JSON.parse(config) : ACCOUNT_CONFIG;
}

// Xử lý form đăng nhập
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');
    const errorMsg = document.getElementById('error-msg');
    const loadingSpinner = document.getElementById('loading-spinner');
    const btnText = document.querySelector('.btn-text');

    // Kiểm tra nếu user đã từng đăng nhập
    const savedUsername = localStorage.getItem('savedUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberCheckbox.checked = true;
        usernameInput.focus();
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const config = getAccountConfig();

        // Hiển thị loading
        loadingSpinner.classList.add('show');
        btnText.style.opacity = '0.6';
        loginForm.querySelector('.login-btn').disabled = true;

        // Simulate network delay
        setTimeout(() => {
            // Kiểm tra thông tin đăng nhập
            if (username === config.username && password === config.password) {
                // Đăng nhập thành công
                const loginData = {
                    username: username,
                    loginTime: new Date().getTime(),
                    token: Math.random().toString(36).substr(2)
                };

                localStorage.setItem('userLogin', JSON.stringify(loginData));

                // Lưu username nếu chọn "Ghi nhớ"
                if (rememberCheckbox.checked) {
                    localStorage.setItem('savedUsername', username);
                } else {
                    localStorage.removeItem('savedUsername');
                }

                // Chuyển hướng
                window.location.href = 'index.html';
            } else {
                // Đăng nhập thất bại
                errorMsg.textContent = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
                errorMsg.classList.add('show');
                
                // Ẩn loading
                loadingSpinner.classList.remove('show');
                btnText.style.opacity = '1';
                loginForm.querySelector('.login-btn').disabled = false;

                // Xóa lỗi sau 4 giây
                setTimeout(() => {
                    errorMsg.classList.remove('show');
                }, 4000);

                passwordInput.value = '';
                passwordInput.focus();
            }
        }, 600);
    });

    // Xóa thông báo lỗi khi user bắt đầu nhập
    usernameInput.addEventListener('input', () => errorMsg.classList.remove('show'));
    passwordInput.addEventListener('input', () => errorMsg.classList.remove('show'));
});
