# Services
sudo cp ./punch-machine.service /etc/systemd/system/punch-machine.service
sudo systemctl enable punch-machine.service
sudo systemctl start punch-machine.service
sudo reboot

# desktop
cp ./kiosk.desktop ~/.config/autostart/kiosk.desktop

# ip address setup at
/etc/dhcpcd.conf