import os
from setuptools import setup
from setuptools.command.build_py import build_py


class JsBuildCommand(build_py):
    def run(self):
        import subprocess
        os.chdir('js')
        try:
            subprocess.check_call(['yarn', 'install'])
            subprocess.check_call(['yarn', 'gulp'])
        finally:
            os.chdir('..')
        super().run()


setup(
        name="biyam",
        version="2017.12.22a0.dev1",
        packages=["biyam"],
        package_data={'biyam': ['*.xml', 'static/*']},
        url='https://github.com/gwangyi/biyam',
        license='MIT',
        author='Sungkwang Lee',
        author_email='gwangyi.kr@gmail.com',
        description='Blockly w/ Python on Jupyter Notebook',
        classifiers=[
            'Development Status :: 3 - Alpha',
            'Programming Language :: Python :: 3',
            'Programming Language :: Python :: 3.6',
        ],
        install_requires=['jupyter'],
        cmdclass={'build_py': JsBuildCommand},
        zip_safe=False
)
