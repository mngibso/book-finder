export default function (templateConfig) {
        const { title, message } = templateConfig.htmlWebpackPlugin.options;

    return `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <title>${title}</title>

                <!-- Google Fonts -->
                <link href="https://fonts.googleapis.com/css?family=Lato:300,400" rel="stylesheet preload">
                <link href="https://fonts.googleapis.com/css2?family=Bellota:wght@700&display=swap" rel="stylesheet">
                
                <link rel="shortcut icon" href="/favicon.ico">
                <meta charset="UTF-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge">

                <!-- Mobile Friendly Tag -->
                <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0">

                <!-- Theme Color -->
                <meta name="theme-color" content="#346CA1">

                <!-- Title -->
                <meta name="React-Stack-2" content="Discover Great Books!">
                <meta property="og:title" content="Discover Great Books!"/>
                <meta property="og:image" content="/images/books-corner.jpg"/>
                <meta property="og:description" content="Discover more books like the books you love."/>
            </head>

            <body>
                <noscript>
                    <h1>Please Enable JS in your browser in order to continue</h1>
                </noscript>

                <div class="bg">
                <div id='root'></div>
                </div>
                <script src='/main.js'></script>
            </body>
        </html>
    `;
}
