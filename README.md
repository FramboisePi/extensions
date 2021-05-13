# Komga - Paperback Promise Sources

This source works with Paperback 0.5.0 (1.0.6) and newer

## Installation guide

1. Clone this repository
```bash
git clone https://github.com/FramboisePi/extensions-promises/
```

2. Go to the folder you've just created
```bash
cd extensions-promises/
```

3. Checkout the right branch
```bash
git checkout Komga-promise-source
```

4. Install packages
```bash
npm install
```

5. Change your server credentials in `/src/Komga/Komga.ts`
> ```js
> const KOMGA_DOMAIN = 'http://192.168.0.23:8081'
> const KOMGA_USERNAME = "demo@komga.org"
> const KOMGA_PASSWORD = "komga-demo"
> ```

6. Serve the repo
```bash
npm run serve
```

7. Add it to the app
In Paperback, go to settings, Sources
Choose a `Repository name` with at least 5 characters
Enter your `Repository Base URL`: it will be of the format `http://192.168.0.32:8000` with the computer you are using ip address
Press `Add repository`

8. Add the source
Open the repository you've just added and install the source