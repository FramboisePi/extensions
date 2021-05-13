# Komga - Paperback Promise Sources

This source works with Paperback 0.5.0 (1.0.6) and newer

## Installation guide

1. Clone this repository
```bash
git clone https://github.com/FramboisePi/extensions-promises/
```

2. Checkout the right branch
In the folder you've just created execute:
```bash
git checkout Komga-promise-source
```

3. Install packages
```bash
npm install
```

4. Change your server credentials in `/src/Komga/Komga.ts`
> ```js
> const KOMGA_DOMAIN = 'http://192.168.0.23:8081'
> const KOMGA_USERNAME = "demo@komga.org"
> const KOMGA_PASSWORD = "komga-demo"
> ```

5. Serve the repo
```bash
npm run serve
```

6. Add it to the app
In Paperback, go to settings, Sources
Choose a `Repository name` with at least 5 characters
Enter your `Repository Base URL`: it will be of the format `http://192.168.0.32:8000` with the computer you are using ip address
Press `Add repository`

7. Add the source
Open the repository you've just added and install the source