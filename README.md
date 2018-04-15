# hugo-forestry-starter
Created from the fantastic [web-starter-hugo](https://github.com/adrinux/web-starter-hugo), this is a fully fleshed out starter website with a headless CMS and deployment provided by [Forestry](https://forestry.io) and continous integration by [CircleCI](https://circleci.com).

Like the base web-starter-hugo, this project uses gulp to process images, javascript, css and html into a Hugo site. The supported Hugo version is currently 0.31.1.

## Features
- [Forestry](https://forestry.io) as content management system (**free** for up to three users), runs Hugo for your users, allows preview of changes before publish
- [CircleCI](https://circleci.com) for continuous integration (**free**), runs your gulp tasks and can do any pre-processing needed for your Hugo site to be perfect
- Forestry can publish to a **free** [GitHub Pages](https://pages.github.com) or to Amazon S3 / FTP (see [hosting options](https://forestry.io/docs/hosting/))
- Or publish and host your site for **free** with [Netlify](https://netlify.com)

## Pipeline map
![alt text](https://raw.githubusercontent.com/dsschneidermann/hugo-forestry-starter/master/build-deploy-pipeline.png)

Some technical details:
- Dual-branch ```master```/```content``` to allow *content* changes to stay separated from code changes until you chose to merge it, if ever.
- Add any build tasks with gulp / npm / webpack or any other toolchain needed for your site before it is built with Hugo. The starter here uses gulp.
- *Uploaded media* by editors starts CircleCI continous integration and uses gulp to create responsive images (in about 20 seconds). Meanwhile the full-size images are used for preview.
- I've used the 'startbootstrap-clean-blog' theme as a starting point and have not supported any blogging out-of-the-box. The blogging can easily be added and it is also easy to switch to any other of the [Hugo themes](https://themes.gohugo.io/).
- For local development this starter uses Browsersync for live reloading, PostCSS and a customizable modernizr setup (all taken from the web-starter-hugo base). I added some flexible asset inlining made with [inline-js](https://www.npmjs.com/package/inline-js).

## How to start

I would suggest to create a new GitHub account (whether you will use GitHub Pages or not) that is linked to webmaster@your-site-name or some other email of yours. The reason for this is two-fold: 1) your GitHub Pages site will be named your-user-name.github.io (unless you want a custom domain) so it makes sense to make it nice and 2) you need to give CircleCI access to push commits to the repository, which is easier if you have a new user.

Note that you can also use GitLab / Bitbucket if you prefer a private repository for your site, it is exactly the same build pipeline and nearly same instructions.

So, with or without your newly made GitHub account:

The easiest, you can simply press the ***fork button at the top of this page*** and edit your repository name afterwards. Or you can manually make a clone:
```
git clone https://github.com/dsschneidermann/hugo-forestry-starter
cd hugo-forestry-starter
git remote rename origin upstream
```

Create your own repository on GitHub and push it:
```
git remote add origin <your-repository-url>
git push -u origin master
```
To update from upstream (_this repository_) at any time, run the ```Build/merge-from-upstream.sh``` script. *It will not commit any changes.*

To start local development, do ```yarn install```, then run the ```Build/run.sh``` script or just ```gulp```.

Note that at some later time, you will probably want to add your normal GitHub account as a contributor to the new repository, so you can always just use your normal account to push changes.

## For Windows users
The node packages require Python 2.7 in order to be installed on Windows. See this [stackoverflow](https://stackoverflow.com/questions/15126050/running-python-on-windows-for-node-js-dependencies#39648550) on installing windws_build_tools - and if you have VS2015 installed, see the open issue [here](https://github.com/felixrieseberg/windows-build-tools/issues/9) also.

If you don't yet have Hugo installed, you can run the provided file: ```Build/install-hugo-windows.bat```. After this you can use ```Build/run.sh``` from the Git bash shell to run gulp, start the site locally and develop your site.

## Setup for CMS and continuous deployment

### CircleCI setup

Login to [CircleCI](https://circleci.com) with your GitHub account and perform the steps:

* Set CircleCI to perform continuous integration.

    Go to "Projects" -> "Add". Select the repository that you made in *How to start*, scroll down and press "Start building".


* Add authentication for the commit back to the ```content``` branch.

    Click the project settings icon and under "Checkout SSH keys", you can choose to press the button to create a GitHub account-wide access key. The key will give access to all repositories, which is fine if you created a new GitHub account for your site.
    
    If that is not an option, you can follow [CircleCI documentation](https://circleci.com/docs/1.0/adding-read-write-deployment-key/) to create a 'read-write repository key' for the single repository.

* Make a commit to your repository and push it. I suggest correcting the site name and url in the ```hugo/config.toml``` file.

    You can monitor the build progress on CircleCI. The first time will take a few minutes to build a yarn cache. The second time it should only take about 20 seconds. Wait for CircleCI to succeed and check that your GitHub repository now has the ```content``` branch with the build result. This is the finished build that we run Hugo on and publish.

    In case of any errors, examine the details from the build result and see if it there is a description of the error. You can find the script at ```Build/circleci_build.sh```.

### Forestry setup

Login to [Forestry.io](https://forestry.io) with your GitHub account and add a new site:

* Add your repository from the dropdown and select the branch ```content```
* Write ```/hugo``` in the field for "this is where we look for your config files"

You will be able to see the site as soon as the repository into Forestry, by using the Preview feature on a page. Finally don't forget to change the content of the ```hugo/config.toml``` file to match your new site details.

### GitHub Pages setup

* Set up GitHub Pages. Create a repository with the name ```your-account-name.github.io``` (see [here](https://pages.github.com/#user-site)) and initialize it with an empty readme file.
* In Forestry go to "Settings" -> "Hosting" and select to push to your GitHub Pages repository. Also make sure that "Deploy on Git push" under "General" is enabled.
* (Optional) Setup a [custom domain](https://help.github.com/articles/using-a-custom-domain-with-github-pages/) for your GitHub Pages site.

   1) Make a CNAME record in DNS settings for www.your-site-name.com
   2) Make a ```src/CNAME``` file containing www.your-site-name.com 


## More deployment options

If you have come up with improvements to the deployment steps above or if you have used this starter with different services, please help improve this repository by letting me know. 

### Netlify

While [Netlify](https://netlify.com) can run our entire build and deployment pipeline (instead of CircleCI), using it in such a manner would not allow us to use Forestry for content editing.

However we can still use Netlify to push and host the site instead of using GitHub Pages. It is also free, arguably provides more functionality as a service and practically has no limit to the amount of updates you make. See Netlify's own [comparison here](https://www.netlify.com/github-pages-vs-netlify/).

#### Setup
Login to [Netlify](https://netlify.com) with your GitHub account and add a new site with configuration:

*   Build command: ```hugo -s hugo -v```

    Publish directory: ```hugo/public```

    Production branch: ```content```
* Add environment variable:

     HUGO_VERSION: 0.31.1

Due to the -v flag given, you will be able to see any errors that occur from the Hugo build.

## Contribute

As mentioned please let me know if you have any improvements to this starter. Pull requests are accepted.

## Documentation
- [web-starter-hugo](https://github.com/adrinux/web-starter-hugo)
- [Gulp](https://github.com/gulpjs/gulp/tree/master/docs)
- [Hugo](https://gohugo.io/overview/introduction/)

More documentation of packages included can be found at the web-starter-hugo project.