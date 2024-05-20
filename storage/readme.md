# Create a Virtual Hard Disk (VHD) with Hyper-V

## Step 1: Create a Virtual Hard Disk
1. Open Hyper-V Manager.
2. In the "Actions" panel, click on "New" and then "Hard Disk".
3. Follow the wizard to create a new virtual hard disk (VHD).
4. Choose "VHD" or "VHDX" (VHDX is the newer and recommended version).
5. Define the size (e.g., 5GB).
6. Save the virtual disk file to an appropriate location on your system.

## Step 2: Attach the Virtual Disk to the Minikube VM
1. In Hyper-V Manager, select your Minikube VM.
2. Click on "Settings".
3. Under "SCSI Controller", click on "Add" and select "Hard Drive".
4. Choose the virtual disk you created earlier.

## Step 3: Access the Minikube Node
1. Start the Minikube VM (if it is not already running).
2. Access the Minikube node using SSH:

    ```sh
    minikube ssh
    ```

## Step 4: Identify and Mount the Virtual Disk
1. List the block devices to identify the new disk. It typically appears as /dev/sdX or /dev/vdX:

    ```sh
    lsblk
    ```
2. Assuming the new disk is /dev/sdb, create a partition on the disk:
    ```sh
    sudo fdisk /dev/sdb
    ```
    Inside fdisk, you can follow these steps:
    - Type `n` to add a new partition.
    - Press Enter to accept the default values.
    - Type `w` to write the partition table and exit.

3. Format the newly created partition with XFS:
    ```sh
    sudo mkfs.xfs /dev/sdb1
    ```

4. Create a mount point and mount the disk:
    ```sh
    sudo mkdir -p /mnt/disks/xfs-disk
    sudo mount /dev/sdb1 /mnt/disks/xfs-disk
    ```

5. Verify that the disk is mounted correctly:
    ```sh
    df -hT /mnt/disks/xfs-disk
    ```