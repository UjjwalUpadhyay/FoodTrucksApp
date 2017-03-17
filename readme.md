# Uber Coding Challenge - San Francisco Movies

### Challenge Link: [prompt]
See it live here: [app]

Things to Note:

1. First pick a Movie Title or Director Name that you want to search for!
2. Start typing - you can either select something from the autocomplete suggestions or finish typing
3. Hit search (or alternatively if you click on a suggestion, it will search automatically!)

![alt tag](https://cloud.githubusercontent.com/assets/5565596/12123308/1b3b40fc-b395-11e5-877c-cb8caa5144ab.png)

UPDATE
--------
I addressed a lot of my initial concerns after I spent a bit of time revisiting the challenge. 

#### Features
* Removed a lot of client-side workload. (Precompiled templates, geocoding, formatting results, etc).
* All data is stored in a database, so there is no dependency on the SF Dataset website
* Greatly improved the speed of autocomplete suggestions
* Added images to each movie from [OMDB]
* Provided some feedback when retrieving no results
* Added a spinner for visual feedback to know when autocomplete finishes

##### Database
The database is in MongoDB. I added OMDB movie posters to each movie so it can be rendered on the client. There are three collections: Movies, Directors, and MovieLocations. 

Movies - Mostly from SF Dataset + OMDB movie poster. Extracted out duplicate information to the following two collections.

Directors - Contains a name. This was extracted because it makes sense relationally, and it makes searching for 'directors' easier because we can decouple it from the Movies collection.

MovieLocations - Contains string address from SF Dataset and it's latitude, longitude coordinates parsed from Google's Geocoder api.

##### Redis
To improve performance, I used Redis to cache search queries. This VASTLY improved real-time search suggestions. Previously it took ~350-1000ms to get search suggestions using the SF Dataset, and now using Redis search results take ~30-280ms.

I precomputed the movies + directors names into redis when the application first starts. The data is formatted as <key='set:query', value=[{movieObjects}]>. 

I got this neat idea from a [rails blog] when I was trying to learn how to use Redis as I haven't had any experience with it until now. 

To illustrate, suppose the movie is 'Alcatraz', redis stores all the movie suggestions for: 'a', 'al', 'alc', 'alca', 'alcat', etc. (with all of them having a unique array of suggestions).

#### Challenges

There were a lot of challenges when I revisited this exercise. The main one that I had trouble with was simply loading + doing pre-computations on the data into the database. The hardest pre-computational step was dealing with rate-limiting from Google's Geocoder API (described below)

I used the async node library to run independent/dependent tasks and then aggregate the results into the db.

Just to illustrate the process, I first make a task that checks to see if the db has already been populated. If not, then it creates it from scratch by the following:

1. Get data from the SF dataset
2. Save each movie to db
  1. Simultaneously grab it's image from OMDB and save it when the request finishes
  2. Simultaneously save its director to the Director collection (because we need to extract it from the movie object at this time).
3. Save the geocoded location to the MovieLocation collection
4. After populating the db, populate the redis db

Definitely Step 3 was the hardest challenge of the project, especially because I have not encountered severe rate-limiting. Google's Geocoder can only process so many requests within a day and those request can't be made 'too fast'. 

To combat this, there was a neat feature in Async called 'async.retry' which allowed me retry geocoding (in case the request failed because of rate-limiting) and handle cases where no geocoded address could be parsed. If this was the case and it did fail, Async's 'async.eachSeries' provides a great way of controlling flow and allows me to only save correctly parsed locations.

Overall, I feel pretty satisfied with this. I got rid of a lot of work on the client-side (like geocoding and rendering template windows for the Google map markers). And I'm sure there can be some optimizations as I'm still new to using Redis and Async.

Back-end
--------
**Node - Express - Handlebars - Heroku** 

I used a simple stack without any frameworks (ie. Angular, React, Backbone, etc) mostly because there was no real need for them. Given the constraints of the problem and the time constraints, I thought it would be best to keep it simple so I can spend less time learning learning the framework and spend more time focusing on the core application.

In addition, I used Heroku to deploy the app. I normally use Heroku to deploy basic web apps mainly because it is simple/fast to deploy, and because the app restarts every so often (easy mechanism to handle crashes).

#### Challenges

The main challenge I faced was using the [Sorcata SODA API]. I chose to use this, instead of loading the data into my own database due to data synchronization issues. Meaning that my application would automatically get the latest version of the dataset if it ever changed. Though looking back at this decision, it may have not been the best design choice because it means my site is now dependent on the stability of Sorcata website. And it just so happened that their site crashed as I was nearing the end of this coding challenge. (>__>). 

But the main reason, why I think I should have created my own database was because of the use case of my application. To place points on Google Maps you need lat/lng coordinates which was not on the dataset (it stored movie locations by 'vague addesses' (i.e. City Hall, Coit Tower, etc). The way the application currently works, is that it uses Google's Geocoder service to evaluate the address to a lat/lng point. So one TODO given more time, would be to preprocess all the data so that each movie has a lat/lng already attached to it. 

Front-end
--------
**JQuery - Google Maps - Boostrap** 

The bulk off the application comes from doing manipulations with Google maps. In [map.js] there is a map module (which should be exported to another file) that is used to add/remove markers (movie locations) using geocoded addresses. There are some bootstrap elements, but they are mainly used for styling and to save time for the core feature of the front-end -- the autocomplete. 

#### Challenges

The main challenges of the front-end was figuring out how to approach autocomplete. I chose JQuery's autocomplete widget as it had all the basic functionality that I wanted: populating suggestions under the search box, but mainly because it already contained a 'request delay' that prevents too many requests from being sent. I.e. if it is set to 300ms, then it waits 300ms after the final keystroke to send the request to the server, or if another key has been pressed within that time, it tries to wait another 300ms.

Another challenge was dealing with the rate limit when querying for movie locations using Google Maps. Because of this 'bug' when querying for movies that have lots of locations, it 'sometimes' does not populate the map with all locations. If there was more time to work, I would definitely address this.

To get the results, I used the SODA API's SoQL feature to query the database. It borrows 'LIKE %s' from SQL, and I then build off of that by grouping duplicate movie titles, and limiting the resulting suggestions. There are two features to the autcomplete and search:

1. Title - This feature searches for movies by their title. It uses one query for autocomplete (we just need movie names to fill out the suggestions box), and it uses another query to actually get all the movie locations with the name that was chosen (these locations will get placed on the map).
2. Director - This feature is similiar to title, in the sense that it searches on director names for autocomplete. After a name has been selected it makes a query to grab all the movies that the director has directed and places them on the Map.

OLD-TODO
--------
* Put dataset in to Database, have a nightly script that gets new data from the dataset
* Testing
* Fix the rate limit bug when placing movie locations on the Google Map.
* If there was more time I would really love to add a feature that shows what other people have recently searched for (movies, directors, etc). I would use Socket.io to do this, and just keep a small list (3-5 searches) that get displayed to everyone using the app, and gets updated in real-time whenever somebody makes a new search.

### Installation

Clone the repo, and 'npm install'. Optionally you can add an environment variable SF_DATASET_URL to specify where you want the movie location data to come from.

   [rails blog]: <http://vladigleba.com/blog/2014/05/30/how-to-do-autocomplete-in-rails-using-redis/>
   [OMDB]: <http://www.omdbapi.com>
   [prompt]: <https://github.com/uber/coding-challenge-tools/blob/master/coding_challenge.md>
   [app]: <https://uber-coding-challenge.herokuapp.com>
   [map.js]: <https://github.com/aaandrew/Uber-Coding-Challenge/blob/master/public/js/map.js>
   [Sorcata SODA API]: <https://dev.socrata.com/docs/queries/>