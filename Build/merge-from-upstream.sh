#!/bin/bash
cd "$(dirname "$0")"
cd ..
git remote add upstream https://github.com/dsschneidermann/hugo-forestry-starter
git fetch upstream
git checkout master

git status | grep -q "nothing to commit"
if [ $? -ne 0 ]
then
    echo "Already has changes in repository, exiting."
    exit 1
fi

git merge upstream/master --no-commit
