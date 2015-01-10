#imgserve.js


##Installation
    git clone https://github.com/manonthemat/imgserve.js.git && cd imgserve.js && mkdir logs && mkdir assets/css && npm install && bower install

##Configuration
Configure your AWS S3, Sendgrid, Twilio and logging settings in the *config* folder.
Usually you might want to use environment variables instead of configuration files, but due to the simplicity of configuration files, I've chosen to use this method instead.

##Testrun
In the terminal run

    node app.js

Open a browser and navigate to [http://localhost:8000/](http://localhost:8000/).

While keeping the browser open, copy a image into the *images* folder. The image should appear in the browser window. Click on a photo and you'll see sharing options.

---

##Known issues
For this project, I've used Google's Polymer for the first time. There are some styling inconsistencies at the moment. Polymer is still in dev preview and [not all browsers support polyfill natively yet](https://www.polymer-project.org/resources/compatibility.html). As a result, my custom element img-share, which embeds a paper-toast has a wrong background color in the Safari browser (and possibly others), due to leaked CSS. This is a known issue of the current version. Feel free to style that element to your liking explicitly.

###ToDo
####img-share
- email input should be nulled after successfully shared photo via email
- phone number input should be nulled after successfully shared photo via email
- tap on paper-toast should scroll to the new photo

####app.js
- logic for deleted photos in filesystem

####index.html
- fade-in animation of incoming photo
- fade-out of deleted photo
