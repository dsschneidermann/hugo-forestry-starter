#!/bin/bash
cd "$(dirname "$0")"
cd ..

echo -n "Working directory: "
pwd

# Git setup
git config --local user.name "CircleCI"
if [ -n "$OWNER_EMAIL" ]
then
    git config --local user.email $OWNER_EMAIL
else
    echo "OWNER_EMAIL not set in .circleci/config.yml - cannot commit result."
fi
sourcebranch="master"
targetbranch="content"
currentbranch=`git rev-parse --abbrev-ref HEAD`

if [ -n "$OWNER_EMAIL" ]
then
echo
echo "--- Git fetch '$targetbranch' ---"
    if [ $currentbranch = $targetbranch ]
    then
        echo "Already on target branch"
    else
        git fetch origin $targetbranch &> /dev/null
        if [ $? -eq 128 ]
        then
            echo
            echo "--- Git create branch ---"
            git checkout -b $targetbranch
        else
            # Make merge commit, resolve all conflicts as the target branch
            git checkout $targetbranch

            # Checkout can fail due to changed yarn.lock file
            currentbranch=`git rev-parse --abbrev-ref HEAD`
            if [ $currentbranch != $targetbranch ]
            then
                git add yarn.lock
                git status --untracked-files=no | grep -q "nothing to commit"
                if [ $? -eq 0 ]
                then
                    echo "No build artifact to commit."
                else
                    git commit -m "Automatic commit of build artifact" -m "[skip ci]"
                    git checkout $targetbranch
                fi
                
                # Make sure we correctly changed branch now
                currentbranch=`git rev-parse --abbrev-ref HEAD`
                if [ $currentbranch != $targetbranch ]
                then
                    echo "Unable to checkout branch '$targetbranch'"
                    exit 1
                fi
                echo "Success"
            fi

            echo
            echo "--- Git merge to '$targetbranch' ---"

            git branch --merged | grep -q "$sourcebranch"
            if [ $? -eq 0 ]
            then
                echo "Branch '$sourcebranch' already has all commits."
                nomerge=1
            else
                # Git merge with master branch, forcing keeping master changes
                git merge --quiet -s recursive -Xtheirs $sourcebranch --no-ff --no-commit
                git status -s
                echo
                git commit -m "Automatic merge of branch '$sourcebranch'" -m "[skip ci]"
            fi
        fi
    fi
fi

echo
echo "--- Build ---"
# Build
node ./node_modules/gulp/bin/gulp -LL --color "CircleCI-build"

if [ $? -gt 0 ]
then
    exit 1
fi

if [ -z "$OWNER_EMAIL" ]
then
    echo
    echo "OWNER_EMAIL not set in .circleci/config.yml - exiting."
    exit 1
fi

echo
echo "--- Git commit build result ---"
git add -f yarn.lock ./hugo/static/* ./hugo/layouts/* ./hugo/images-cache/*
git status -s
git status --untracked-files=no | grep -q "nothing to commit"
if [ $? -eq 0 ]
then
    echo "Nothing added from build results."
    nofiles=1
else
    echo
    git commit -m "Automated build of '$targetbranch' by CircleCI" -m "[skip ci]"
fi

echo
echo "--- Git push to '$targetbranch' ---"
if [ -v nofiles -a -v nomerge ]
then
    echo "Nothing to push."
else
    git pull --quiet origin $targetbranch
    git push origin $targetbranch
fi

# Reset to start branch
git checkout $currentbranch &> /dev/null
