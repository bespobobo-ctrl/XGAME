module.exports = {
    apps: [{
        name: "gamezone-server",
        script: "./src/index.js",
        cwd: "./",
        instances: 1, // SQLite uchun 1 (Concurrency oldini olish uchun)
        autorestart: true,
        watch: false, // Prod-da watch: true tavsiya etilmaydi
        max_memory_restart: '1G',
        env: {
            NODE_ENV: "production",
            SERVER_PORT: 3001
        },
        error_file: "./logs/pm2-error.log",
        out_file: "./logs/pm2-out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
        merge_logs: true
    }]
};
