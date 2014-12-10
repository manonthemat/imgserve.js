#imgserve.js


##Installation
    git clone https://github.com/manonthemat/imgserve.js.git && cd imgserve.js && npm install && bower install

##Configuration
Configure your AWS S3, Sendgrid and Twilio settings in the *config* folder.

##Testrun
In the terminal run

    node app.js

Open a browser and navigate to [http://localhost:8000/](http://localhost:8000/).

While keeping the browser open, copy a image into the *images* folder. The image should appear in the browser window. Click on a photo and you'll see sharing options.
