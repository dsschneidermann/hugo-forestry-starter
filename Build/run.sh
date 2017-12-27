#!/bin/bash
cd "$(dirname "$0")"
cd ..

verbosity="-LL"
args=""
while test $# -gt 0
do
    case "$1" in
        --verbose)
            verbosity="-LLL";;                    
        -v)
            verbosity="-LLL";;
        --*)
            showhelp=1;;
        -*)
            showhelp=1;;
        *)
            space=" "
            break;;
    esac
    shift
done

if test $showhelp; then
    echo Usage: run.sh \[-v\] \<taskname\> 
    echo --verbose, -v: Print output from gulp
else
    echo -n "Working Directory: "
    pwd
    echo "Running gulp$space$@.."
    node ./node_modules/gulp/bin/gulp --color $verbosity $@
fi

exit 0