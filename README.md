# hugo-forestry-starter
Created from the fantastic [web-starter-hugo](https://github.com/adrinux/web-starter-hugo), this is a fully fleshed out starter website with a headless CMS and deployment provided by [Forestry](https://forestry.io) and continous integration by [CircleCI](https://circleci.com).

Like the base web-starter-hugo, this project uses gulp to process images, javascript, css and html into a Hugo site. The supported Hugo version is currently 0.31.1.

## Features
- [Forestry](https://forestry.io) as content-management system (**free** for single-user), runs Hugo for you, allows preview of your content changes before publish and automatically deploys your site.
- [CircleCI](https://circleci.com) for continuous integration (**free**), runs scripts and gulp tasks and can do any compilation needed for yor Hugo site to be perfect.
- Publish with Forestry automatically to a [GitHub Pages](https://pages.github.com) site for a **100% free, globally CDN hosted, CMS backed website**. I think that's *extremely super* cool. (See other [Hosting Options](https://forestry.io/docs/hosting/) provided by Forestry.)

Some technical details:
- Dual-branch ```master```/```content``` setup to allow CMS *content* commits to stay separated from code changes until you chose to pull it in.
- Add any javascript, gulp libraries or other pre-processing to your site build.
- CircleCI builds immediately on changes to ```master``` and automatically merges changes up to ```content```.
- New uploaded media from Forestry also starts continous integration and creates responsive versions (in about 20 seconds).
- I've used the 'startbootstrap-clean-blog' theme as a starting point. I also removed the blogging part, but it's easy to add back.
- Like web-starter-hugo, this project has Browsersync for live reloading, PostCSS, a customizable modernizr setup. And I added flexible asset inlining (with a gulp plugin I made for [inline-js](https://www.npmjs.com/package/inline-js)).

## How to setup for dev
```
git clone https://github.com/dsschneidermann/hugo-forestry-starter YOUR_NEW_SITE_NAME
git remote rename origin upstream
```

Upload to your own repository:
```
git remote add origin <your-repository-url>
git push -u origin master
```
To update from upstream (_this repository_) at any time, run the ```Build/merge-from-upstream.sh``` script.

The node packages require Python 2.7 in order to be installed on Windows. See [stackoverflow](https://stackoverflow.com/questions/15126050/running-python-on-windows-for-node-js-dependencies#39648550) on installing windws_build_tools - and if you have VS2015 installed, see the open issue [here](https://github.com/felixrieseberg/windows-build-tools/issues/9) also.

Also if you are on Windows and need to install hugo, you can run the provided file: ```Build/install-hugo-windows.bat```. After this you can use ```Build/run.sh``` to run gulp, start the site locally and develop. 

## How to setup for CMS and continuous deployment

Login to [CircleCI](https://circleci.com) with your GitHub account details and check "Projects" -> "Add". Select your repository, scroll down and press "Start building". Now we need to add two missing ingredients.

1) There is no SSH key auth for the commit back to repository:

    Click the project settings icon and under "Checkout SSH keys", you can either follow [CircleCI documentation](https://circleci.com/docs/1.0/adding-read-write-deployment-key/) to create a 'read-write repository key' or you can press the button to create a GitHub user-wide key (much easier, but gives access to write all your repositories).

2) There is no email to commit as:

    Edit the .circleci/config.yml and enter a value for ```OWNER_EMAIL``` near the beginning of the file. The email will be public in the commit, so for GitHub use your ```name-number@users.noreply.github.com``` address.

```
git add .circleci/config.yml
git commit -m "Add my email address"
git push
```

The second time the build runs it should only take 20 seconds, using cached packages - wait for it to finish and it should have created the ```content``` branch in your repository. This is the finished build that we can use Hugo on.

Finally, login to [Forestry.io](https://forestry.io) with your GitHub credentials and create a new site:
- Add your repository and select the branch ```content```
- Write ```/hugo``` in the step "this is where we look for your config files"
- Set up GitHub Pages (create a repository - see [here](https://pages.github.com/#user-site) and initialize it with a license file).

You should be able to see the site as soon as the repository is loaded by using the Preview feature. Don't forget to change the content of the ```hugo/config.toml``` file to match your new site details.

## Documentation
- [web-starter-hugo](https://github.com/adrinux/web-starter-hugo)
- [Gulp](https://github.com/gulpjs/gulp/tree/master/docs)
- [Hugo](https://gohugo.io/overview/introduction/)

More documentation of packages included can be found at the web-starter-hugo project.